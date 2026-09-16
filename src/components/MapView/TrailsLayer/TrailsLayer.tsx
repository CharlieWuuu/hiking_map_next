'use client';

import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

import L from 'leaflet';
import { useTranslations } from 'next-intl';
import { createContext, Fragment, memo, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CircleMarker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import type { Hike } from '../../../lib/db/hikes';
import { fetchHikeDetail } from '../../../lib/db/hikes.query.actions';
import type { ReferenceLayers } from '../../../lib/db/referenceLayers';
import { CLUSTER_ZOOM, DETAIL_ZOOM, useMapStore, type LngLat } from '../../../lib/mapStore';
import type { OverlayControl } from '../LayerSwitcher';
import MapView from '../MapView';

export type MapTrail = {
  slug: string;
  path: LngLat[]; // [經度, 緯度]，這是簡化後的線
  // 完整軌跡在 R2 的網址，放大到看得出差別時才會去抓
  trackUrl?: string | null;
  // [minLng, minLat, maxLng, maxLat]，用來判斷是否進入視野
  bbox?: [number, number, number, number] | null;
  // 有給的話，選中路線時會在地圖上浮現這張資訊卡
  name?: string;
  county?: string | null;
  town?: string | null;
  distanceKm?: number;
};

type Props = {
  // 有給的話只畫這份固定清單（例如編輯頁預覽單一路線），不會動用 store 依視野動態抓資料。
  // 不給則由地圖自己依 zoom/bounds 呼叫 findInView，用於 /data 這種要顯示大量紀錄的頁面
  trails?: MapTrail[];
  // 動態模式底下要抓誰的紀錄
  userId?: string;
  // 動態模式下篩選特定分類（百岳/小百岳/百大必訪步道），跟頁面清單的篩選保持一致
  category?: string;
  // 外層容器（例如全螢幕切換）尺寸明確變化時傳入新值，強制地圖重新量測——見 MapView 的 resizeKey
  resizeKey?: unknown;
  // 網址帶著的初始視野（動態模式專用）；沒有就用預設的全台視野
  initialViewport?: { center: [number, number]; zoom: number };
  // 疊在自己軌跡之上的官方名單圖層；沒開的圖層不會傳進來
  referenceLayers?: ReferenceLayers | null;
  visibleLayers?: { hike: boolean; hundred: boolean; smallHundred: boolean; hundredTrail: boolean };
  // 各層的不透明度，重疊處靠它分辨
  layerOpacity?: Record<MarkerKind, number>;
  // 疊圖開關交給地圖自己的圖層面板顯示，不另外浮一塊在地圖上
  overlays?: OverlayControl;
};

const DEFAULT_CENTER: [number, number] = [23.7, 120.9];
const DEFAULT_ZOOM = 7;

// 官方名單疊圖。配色刻意讓開：金黃是「我的軌跡」的顏色，名單用冷色系，
// 疊在一起時一眼分得出哪些是自己走過的。已完成的名單項目加亮，未完成的壓暗。
// 全部 interactive={false}——疊圖只是背景參考，不該搶走軌跡的點擊與 hover
// 圖層身分用「色相」表達（跟面板色塊同一組），完成與否用「明度」表達。
// 先前是用兩個固定藍色表示完成/未完成，結果面板的紫色在地圖上從來沒出現過——
// 兩套配色互相打架。現在同一層永遠是同一個色相，面板與地圖對得起來
const LAYER_BASE_COLOR: Record<MarkerKind, string> = {
  hike: '#A67C00',
  hundred: '#7FD4FF',
  smallHundred: '#4A9FD4',
  hundredTrail: '#B08CFF',
};

// 未完成的壓暗，讓已完成的自然跳出來
const DIM_COLOR: Record<MarkerKind, string> = {
  hike: '#5C4500',
  hundred: '#3F6A80',
  smallHundred: '#2A5670',
  hundredTrail: '#5B4880',
};

const layerColor = (kind: MarkerKind, completed: boolean) => (completed ? LAYER_BASE_COLOR[kind] : DIM_COLOR[kind]);

function ReferenceMountainLayer({ items, kind }: { items: { id: number; name: string; lat: number; lng: number; completed: boolean }[]; kind: MarkerKind }) {
  const pane = useContext(LayerPaneContext);
  return (
    <>
      {items.map((item) => (
        <CircleMarker
          key={`${kind}-${item.id}`}
          center={[item.lat, item.lng]}
          radius={4}
          interactive={false}
          pane={pane}
          // className 帶著分類，cluster 圖示才數得出這一團的組成
          className={kind}
          pathOptions={{ color: '#ffffff', weight: 1, fillColor: layerColor(kind, item.completed), fillOpacity: 1 }}
        />
      ))}
    </>
  );
}

function ReferenceTrailLayer({ items, kind }: { items: { id: number; name: string; path: [number, number][]; completed: boolean }[]; kind: MarkerKind }) {
  const pane = useContext(LayerPaneContext);
  return (
    <>
      {items.map((item) => {
        if (item.path.length === 0) return null;
        const positions = item.path.map(([lng, lat]) => [lat, lng] as [number, number]);
        // 跟自己的軌跡一樣畫兩層：先鋪一條較寬的白色描邊，再疊上本色。
        // 底圖是灰階的，單畫一條細藍線壓在山區紋理上會糊掉，白邊把線從底圖分離出來
        return (
          <Fragment key={item.id}>
            <Polyline positions={positions} interactive={false} pane={pane} pathOptions={{ color: '#ffffff', weight: 5, opacity: 0.9 }} />
            <Polyline positions={positions} interactive={false} pane={pane} pathOptions={{ color: layerColor(kind, item.completed), weight: 3 }} />
          </Fragment>
        );
      })}
    </>
  );
}

const LayerPaneContext = createContext<string | undefined>(undefined);

// 每個圖層一個 Leaflet pane，用 zIndex 決定誰疊在誰上面。
// 不靠 JSX 先後順序是因為那只影響 DOM 插入順序，Leaflet 把所有向量圖形
// 都畫進同一個 overlayPane，先後會被它自己的管理覆蓋掉——pane 才是它的正解
function LayerPane({ name, zIndex, opacity, children }: { name: string; zIndex: number; opacity: number; children: ReactNode }) {
  const map = useMap();
  // 自己建 pane 並設 zIndex，不用 react-leaflet 的 <Pane>——它掛載時也會呼叫
  // createPane，而 Leaflet 對同名 pane 會直接拋錯（A pane with this name already exists）。
  // 這裡只在不存在時建立，重繪時就只是更新 zIndex
  if (!map.getPane(name)) map.createPane(name);
  const pane = map.getPane(name)!;
  pane.style.zIndex = String(zIndex);
  // 疊圖只是背景參考，不接滑鼠事件，才不會擋住底下軌跡的點擊
  pane.style.pointerEvents = name === 'layer-hike' ? '' : 'none';
  pane.style.opacity = String(opacity);

  // 把 pane 名稱交給底下的向量圖形，Leaflet 會把它們畫進這個 pane
  return <LayerPaneContext.Provider value={name}>{children}</LayerPaneContext.Provider>;
}

// 選中路線變更時，讓地圖平移縮放到該路線範圍。
// 吃 slug + bbox 而不是整個 trail 物件：動態模式下 bbox 來自清單點擊當下就有的資料
// （見 mapStore 的 activeBbox），不必等 findOne 打回來才知道要飛去哪裡——那支 API
// 只是用來補 popup 需要的縣市/距離等文字，跟「該不該移動地圖」無關
function PanToActiveEffect({ slug, bbox, fallbackPath }: { slug: string | null; bbox: MapTrail['bbox']; fallbackPath: LngLat[] }) {
  const map = useMap();
  const setViewport = useMapStore((state) => state.setViewport);

  useEffect(() => {
    if (!slug) return;
    // 有 bbox 就直接用，不必為了算範圍走過整條路徑
    const bounds = bbox
      ? L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]])
      : L.latLngBounds(fallbackPath.map(([lng, lat]) => [lat, lng] as [number, number]));
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, { padding: [40, 40] });
    // fitBounds 如果目標範圍剛好已經在視野內、zoom 也沒變，Leaflet 不會真的觸發 moveend/zoomend，
    // ViewportSync 就抓不到這次移動，資料要等使用者自己再動一下地圖才會刷新。這裡主動同步一次，
    // 確保不管有沒有觸發事件，viewport 狀態一定會更新，該載的資料才會照常載入
    const newBounds = map.getBounds();
    setViewport(map.getZoom(), [newBounds.getWest(), newBounds.getSouth(), newBounds.getEast(), newBounds.getNorth()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, map]);

  return null;
}

// 把地圖目前的縮放與範圍同步進 store。動態模式下由這裡驅動 fetchInView，
// 固定模式（trails 由外部傳入）則只驅動完整軌跡的載入
function ViewportSync({ trails, userId, category }: { trails?: MapTrail[]; userId?: string; category?: string }) {
  const zoom = useMapStore((state) => state.zoom);
  const bounds = useMapStore((state) => state.bounds);
  const setViewport = useMapStore((state) => state.setViewport);
  const loadTrack = useMapStore((state) => state.loadTrack);
  const touchTracks = useMapStore((state) => state.touchTracks);
  const fetchInView = useMapStore((state) => state.fetchInView);

  const map = useMap();
  const isDynamic = trails === undefined;

  function sync() {
    const b = map.getBounds();
    setViewport(map.getZoom(), [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }

  useMapEvents({ zoomend: sync, moveend: sync });

  // 掛載時先同步一次，之後才由事件接手
  useEffect(sync, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 動態模式：視野或縮放層級一變就重新跟 findInView 要資料
  useEffect(() => {
    if (!isDynamic || !bounds) return;
    // userId 不傳給 fetchInView（伺服器端自己從登入態取），
    // 但仍留在 deps 裡：換人登入時視野內的資料要重抓
    void fetchInView(bounds, zoom, category);
  }, [isDynamic, bounds, zoom, userId, category, fetchInView]);

  // 動態模式不需要再額外去 R2 抓完整軌跡：後端 findInView 已經依 zoom 判斷，
  // >= DETAIL_ZOOM 時 markers 的 geojson 本身就是完整軌跡，不是簡化線

  // 固定模式：視野內的紀錄放大到 DETAIL_ZOOM 才換完整軌跡
  useEffect(() => {
    if (isDynamic || !trails || !bounds) return;

    const visible = trails.filter((trail) => intersects(trail.bbox, bounds));
    touchTracks(visible.map((trail) => trail.slug));

    if (zoom < DETAIL_ZOOM) return;
    for (const trail of visible) {
      if (trail.trackUrl) void loadTrack(trail.slug, trail.trackUrl);
    }
  }, [isDynamic, trails, bounds, zoom, loadTrack, touchTracks]);

  return null;
}

// 動態模式：把目前視野中心／zoom 寫回網址，重新整理或分享連結都能回到原本看的位置。
// 直接改 history 而不走 next-intl 的 router，避免每次拖曳地圖都觸發一次 server round-trip
function ViewportUrlSync() {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const url = new URL(window.location.href);
      url.searchParams.set('lat', center.lat.toFixed(5));
      url.searchParams.set('lng', center.lng.toFixed(5));
      url.searchParams.set('z', String(map.getZoom()));
      window.history.replaceState(null, '', url);
    },
  });

  return null;
}

// bbox 缺漏時一律當作在視野內，寧可多載入也不要整條線消失
function intersects(bbox: MapTrail['bbox'], view: [number, number, number, number]) {
  if (!bbox) return true;
  return bbox[0] <= view[2] && bbox[2] >= view[0] && bbox[1] <= view[3] && bbox[3] >= view[1];
}

// cluster 圖示改成跟單一路線點位同一個棕色，圓圈大小依照聚合數量分級，數字置中
const CLUSTER_COLOR = '#A67C00';

// 每個標記用 data-kind 標明自己屬於哪一類，cluster 圖示才數得出組成。
// 只用一個 MarkerClusterGroup（而不是每類一個）：多個 group 各自聚合時，
// leaflet.markercluster 不做跨 group 的碰撞偵測（它的 spiderfy／maxClusterRadius
// 都只在單一 group 內作用），地理位置相近的圓圈就會直接疊在一起。
// 單一 group 則結構上不可能重疊，組成改用圓餅的扇形來表達，資訊也沒有損失
export type MarkerKind = 'hike' | 'hundred' | 'smallHundred' | 'hundredTrail';

const KIND_COLOR: Record<MarkerKind, string> = {
  hike: CLUSTER_COLOR,
  hundred: '#7FD4FF',
  smallHundred: '#4A9FD4',
  hundredTrail: '#B08CFF',
};

const KIND_ORDER: MarkerKind[] = ['hike', 'hundred', 'smallHundred', 'hundredTrail'];

// 把各類數量畫成實心圓餅（conic-gradient）。單一分類時是純色圓，
// 混合時才出現扇形分割——一眼看得出這一團以哪一類為主，不必拆成多個圓圈
function buildPieBackground(counts: Record<MarkerKind, number>, total: number): string {
  const stops: string[] = [];
  let acc = 0;
  for (const kind of KIND_ORDER) {
    const n = counts[kind];
    if (!n) continue;
    const from = (acc / total) * 360;
    acc += n;
    const to = (acc / total) * 360;
    stops.push(`${KIND_COLOR[kind]} ${from}deg ${to}deg`);
  }
  // 全部同一類時不必畫漸層，純色即可
  return stops.length === 1 ? KIND_COLOR[KIND_ORDER.find((k) => counts[k])!] : `conic-gradient(${stops.join(', ')})`;
}

function createClusterIcon(cluster: { getChildCount: () => number; getAllChildMarkers?: () => { options?: { className?: string } }[] }) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 32 : count < 100 ? 40 : 48;

  const counts: Record<MarkerKind, number> = { hike: 0, hundred: 0, smallHundred: 0, hundredTrail: 0 };
  for (const child of cluster.getAllChildMarkers?.() ?? []) {
    const kind = (child.options?.className as MarkerKind) || 'hike';
    if (kind in counts) counts[kind] += 1;
    else counts.hike += 1;
  }
  const total = KIND_ORDER.reduce((sum, k) => sum + counts[k], 0) || count;
  const background = buildPieBackground(counts, total);

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${background};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      /* 白字配一層淡灰陰影：純白在淺藍上對比只有 1.65，靠一點暗影把字
         從底色拉開。陰影刻意放輕（灰、低不透明度、不偏移），濃黑會糊掉 */
      color: #ffffff;
      text-shadow: 0 0 4px rgba(60, 60, 60, 0.75);
      font-weight: bold;
      font-size: ${count < 100 ? 13 : 12}px;
    ">${count}</div>`,
    className: '',
    iconSize: L.point(size, size, true),
  });
}

// 單一路線的三條線（熱區＋外框＋內線）。用 memo 包起來，hover/選取切換時只有
// 真正變化的那一條會重新算 pathOptions，其餘路線的 Polyline 不會跟著重新 render——
// 不然清單 hover 一晃，畫面上所有路線的線都會被判定成「props 變了」重畫一次，看起來像閃爍
const TrailPolylines = memo(function TrailPolylines({ slug, path, isActive, isHover }: { slug: string; path: LngLat[]; isActive: boolean; isHover: boolean }) {
  const setHoverSlug = useMapStore((state) => state.setHoverSlug);
  const setActiveSlug = useMapStore((state) => state.setActiveSlug);
  const pane = useContext(LayerPaneContext);

  // path 本身（來自 tracks Map 或 trail.path）是穩定參照，只有真的重新載入才會變，
  // 這裡才 useMemo，避免每次 render 都重新配置新陣列讓 memo 失效
  const latLngPath = useMemo<[number, number][]>(() => path.map(([lng, lat]) => [lat, lng]), [path]);

  const [outlineColor, outlineWeight, coreColor, coreWeight] = isActive
    ? ['#000000', 8, '#FFFF3C', 4]
    : isHover
      ? ['#ffffff', 8, '#FFFF3C', 4]
      : ['#ffffff', 6, '#A67C00', 3];

  return (
    <Fragment key={slug}>
      {/* 透明加寬的點擊/hover 熱區 */}
      <Polyline
        positions={latLngPath}
        pane={pane}
        pathOptions={{ color: 'transparent', weight: 16 }}
        eventHandlers={{
          mouseover: () => setHoverSlug(slug),
          mouseout: () => setHoverSlug(null),
          click: () => setActiveSlug(isActive ? null : slug),
        }}
      />
      <Polyline positions={latLngPath} pane={pane} pathOptions={{ color: outlineColor, weight: outlineWeight }} interactive={false} />
      <Polyline positions={latLngPath} pane={pane} pathOptions={{ color: coreColor, weight: coreWeight }} interactive={false} />
    </Fragment>
  );
});

// 選中路線時，浮現一張跟版面其他卡片同一套語言的懸浮資訊卡，取代 Leaflet 預設的白底泡泡。
// Popup 直接掛在 MapContainer 底下（沒有依附任何 layer）時，react-leaflet 掛載時就會自動開啟
function ActiveTrailPopup({ trail, position }: { trail: MapTrail; position: [number, number] }) {
  const t = useTranslations('TrailListItem');

  if (!trail.name) return null;

  return (
    <Popup position={position} closeButton={false} autoPan={false} className="hiking-map-popup" minWidth={180}>
      <div className="bg-panel text-background-contrary rounded-panel flex flex-col gap-1 p-3">
        <span className="text-base font-bold">{trail.name}</span>
        <span className="text-background-contrary/60 text-xs">
          {trail.county} {trail.town}
        </span>
        {trail.distanceKm !== undefined && <span className="text-accent mt-1 text-sm font-semibold">{t('distanceValue', { distance: trail.distanceKm })}</span>}
      </div>
    </Popup>
  );
}

// 動態模式選中某筆紀錄時，findInView 給的欄位不夠顯示浮現卡，額外打 findOne 補足 name/county/town/distanceKm。
// 職責刻意跟 findInView 分開：地圖列表只管位置與線，詳情資料只有選中當下才需要
function useActiveHikeDetail(activeSlug: string | null, isDynamic: boolean) {
  const [detail, setDetail] = useState<Hike | null>(null);

  useEffect(() => {
    if (!isDynamic || !activeSlug) return;
    let cancelled = false;
    fetchHikeDetail(Number(activeSlug))
      .then((hike) => {
        if (!cancelled) setDetail(hike);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSlug, isDynamic]);

  // 沒有選中、不是動態模式，或 detail 還是上一筆選中紀錄的殘留（新請求還沒回來），都回傳 null
  return isDynamic && activeSlug && String(detail?.id) === activeSlug ? detail : null;
}

export default function TrailsLayer({ trails, userId, category, resizeKey, initialViewport, referenceLayers, visibleLayers, overlays, layerOpacity }: Props) {
  const hoverSlug = useMapStore((state) => state.hoverSlug);
  const activeSlug = useMapStore((state) => state.activeSlug);
  const activeBbox = useMapStore((state) => state.activeBbox);
  const setActiveSlug = useMapStore((state) => state.setActiveSlug);
  const tracks = useMapStore((state) => state.tracks);
  const markers = useMapStore((state) => state.markers);
  const zoom = useMapStore((state) => state.zoom);

  const isDynamic = trails === undefined;
  const activeHikeDetail = useActiveHikeDetail(activeSlug, isDynamic);

  // 兩種模式統一成同一份 { slug, path, trackUrl, bbox } 陣列給下面畫線邏輯共用
  const lineTrails: MapTrail[] = isDynamic
    ? markers
        .filter((marker) => marker.geojson)
        .map((marker) => ({
          slug: String(marker.id),
          path: flattenGeojsonPath(marker.geojson),
          trackUrl: marker.trackUrl,
          bbox: marker.bbox,
          name: marker.name,
        }))
    : (trails ?? []);

  const activeTrail: MapTrail | null = isDynamic
    ? activeHikeDetail
      ? {
          slug: String(activeHikeDetail.id),
          path: [],
          trackUrl: activeHikeDetail.trackUrl,
          name: activeHikeDetail.name,
          county: activeHikeDetail.county,
          town: activeHikeDetail.town,
          distanceKm: activeHikeDetail.distanceKm,
          bbox: activeHikeDetail.bbox,
        }
      : null
    : (lineTrails.find((trail) => trail.slug === activeSlug) ?? null);
  const activeTrailPath = activeTrail
    ? (tracks.get(activeTrail.slug)?.path ?? lineTrails.find((trail) => trail.slug === activeTrail.slug)?.path ?? activeTrail.path)
    : null;
  const activeTrailMidpoint = activeTrailPath?.[Math.floor(activeTrailPath.length / 2)];
  const activeTrailMidpointLng = activeTrailMidpoint?.[0];
  const activeTrailMidpointLat = activeTrailMidpoint?.[1];
  // Popup 的 position 得是穩定參照：activeTrailMidpoint 的數值就算沒變，
  // 這裡如果每次 render 都 new 一個 [lat, lng] 陣列，react-leaflet 的 Popup 會被判定成
  // position 變了而重新觸發開啟動畫，hover 造成的無關 re-render 就會讓 popup 看起來反覆重新彈出。
  // 這張卡片本來就是跟著「被選中的那條路線」走：換 slug 必然換一批座標資料，中點數值會跟著變；
  // 同一個 slug 完整軌跡載入完成時，中點數值也會更新一次——用座標數值當依賴，兩種情況都能正確觸發
  const activeTrailPopupPosition = useMemo<[number, number] | null>(
    () => (activeTrailMidpointLat !== undefined && activeTrailMidpointLng !== undefined ? [activeTrailMidpointLat, activeTrailMidpointLng] : null),
    [activeTrailMidpointLat, activeTrailMidpointLng]
  );

  // < CLUSTER_ZOOM 只畫點位（走 cluster），達到門檻才畫線；固定模式一律畫線，本來資料量就小。
  // focus 純粹是 UI 狀態（外框樣式、popup），不影響地圖該載什麼——資料完全由 zoom/視野決定
  // 疊放順序固定：名單在下、自己的軌跡在上。重疊處靠各層透明度分辨
  const ORDER: MarkerKind[] = ['hike', 'hundredTrail', 'hundred', 'smallHundred'];
  const paneZ = (kind: MarkerKind) => 400 + (ORDER.length - ORDER.indexOf(kind));
  const opacityOf = (kind: MarkerKind) => layerOpacity?.[kind] ?? 1;

  const showClusterOnly = isDynamic && zoom < CLUSTER_ZOOM;

  return (
    <MapView
      center={initialViewport?.center ?? DEFAULT_CENTER}
      zoom={initialViewport?.zoom ?? DEFAULT_ZOOM}
      className="rounded-panel h-full w-full overflow-hidden"
      resizeKey={resizeKey}
      overlays={overlays}
    >
      <PanToActiveEffect slug={activeSlug} bbox={(isDynamic ? activeBbox : null) ?? activeTrail?.bbox ?? null} fallbackPath={activeTrail?.path ?? []} />
      <ViewportSync trails={trails} userId={userId} category={category} />
      {isDynamic && <ViewportUrlSync />}

      {/* 疊圖的線先畫，自己的軌跡才會蓋在它上層——名單是背景參考，不該遮住主角。
          遠 zoom（showClusterOnly）時不畫線，只讓點併進下面的 cluster */}
      {/* 畫線層：三個名單各自一個 pane，透明度才能分別調。
          山頭沒有路線幾何（一座山可以有很多條路上去），所以仍是點，
          但畫得比遠 zoom 的小一點，讓位給軌跡 */}
      {!showClusterOnly && referenceLayers && visibleLayers?.hundredTrail && (
        <LayerPane name="layer-hundredTrail" zIndex={paneZ('hundredTrail')} opacity={opacityOf('hundredTrail')}>
          <ReferenceTrailLayer items={referenceLayers.hundredTrail} kind="hundredTrail" />
        </LayerPane>
      )}
      {/* 山頭也畫線：透過 trail_mountains 對應到的步道幾何。
          一座山可以有很多條路上去，所以是多對多，不是一山一線。
          沒有關聯步道的山頭（百岳 70 座、小百岳 17 座）仍以點呈現，
          否則那些山會整個消失 */}
      {!showClusterOnly && referenceLayers && visibleLayers?.hundred && (
        <LayerPane name="layer-hundred" zIndex={paneZ('hundred')} opacity={opacityOf('hundred')}>
          <ReferenceTrailLayer items={referenceLayers.hundredLines} kind="hundred" />
          <ReferenceMountainLayer items={referenceLayers.hundred} kind="hundred" />
        </LayerPane>
      )}
      {!showClusterOnly && referenceLayers && visibleLayers?.smallHundred && (
        <LayerPane name="layer-smallHundred" zIndex={paneZ('smallHundred')} opacity={opacityOf('smallHundred')}>
          <ReferenceTrailLayer items={referenceLayers.smallHundredLines} kind="smallHundred" />
          <ReferenceMountainLayer items={referenceLayers.smallHundred} kind="smallHundred" />
        </LayerPane>
      )}

      {activeTrail && activeTrailPopupPosition && <ActiveTrailPopup key={activeTrail.slug} trail={activeTrail} position={activeTrailPopupPosition} />}

      {showClusterOnly ? (
        // 自己的紀錄與官方名單共用同一個 cluster group：多個 group 各自聚合時彼此會疊在一起
        // （套件不做跨 group 碰撞偵測），單一 group 則結構上不可能重疊，
        // 組成改由圓環分段表達
        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
          {(visibleLayers?.hike !== false ? markers : []).map((marker) =>
            marker.center ? (
              <CircleMarker
                key={marker.id}
                center={[marker.center[1], marker.center[0]]}
                radius={6}
                className="hike"
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#A67C00', fillOpacity: 1 }}
                eventHandlers={{ click: () => setActiveSlug(activeSlug === String(marker.id) ? null : String(marker.id), marker.bbox) }}
              />
            ) : null
          )}
          {referenceLayers && visibleLayers?.hundred && <ReferenceMountainLayer items={referenceLayers.hundred} kind="hundred" />}
          {referenceLayers && visibleLayers?.smallHundred && <ReferenceMountainLayer items={referenceLayers.smallHundred} kind="smallHundred" />}
          {referenceLayers && visibleLayers?.hundredTrail && (
            <ReferenceMountainLayer
              items={referenceLayers.hundredTrail
                .filter((t) => t.lat != null && t.lng != null)
                .map((t) => ({ ...t, lat: t.lat as number, lng: t.lng as number }))}
              kind="hundredTrail"
            />
          )}
        </MarkerClusterGroup>
      ) : (
        // 到了畫線這一層就不再畫名單的點位：這裡的主角是軌跡，
        // 散在線上的小圓點只會干擾判讀。名單的分布在遠 zoom 的
        // cluster 圓餅上已經看得到，近看時讓位給線
        visibleLayers?.hike !== false && (
          <LayerPane name="layer-hike" zIndex={paneZ('hike')} opacity={opacityOf('hike')}>
            {lineTrails.map((trail) => {
              // 完整軌跡還沒到就先畫簡化線，載好再換掉，中間不要出現空白
              const path = tracks.get(trail.slug)?.path ?? trail.path;
              return <TrailPolylines key={trail.slug} slug={trail.slug} path={path} isActive={trail.slug === activeSlug} isHover={trail.slug === hoverSlug} />;
            })}
          </LayerPane>
        )
      )}
    </MapView>
  );
}

// 後端存的是 MultiLineString，這裡只取第一條線
function flattenGeojsonPath(geometry: unknown): LngLat[] {
  if (!geometry || typeof geometry !== 'object' || !('type' in geometry) || !('coordinates' in geometry)) return [];
  if (geometry.type === 'LineString') return geometry.coordinates as LngLat[];
  if (geometry.type === 'MultiLineString') return (geometry.coordinates as LngLat[][])[0] ?? [];
  return [];
}
