'use client';

import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

import L from 'leaflet';
import { useTranslations } from 'next-intl';
import { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { CircleMarker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import type { Hike } from '../../../lib/api/adapters/hikes';
import { fetchHikeDetail } from '../../../lib/db/hikes.query.actions';
import { CLUSTER_ZOOM, DETAIL_ZOOM, useMapStore, type LngLat } from '../../../lib/mapStore';
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
};

const DEFAULT_CENTER: [number, number] = [23.7, 120.9];
const DEFAULT_ZOOM = 7;

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
    void fetchInView(bounds, zoom, userId, category);
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

function createClusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 32 : count < 100 ? 40 : 48;

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${CLUSTER_COLOR};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
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
        pathOptions={{ color: 'transparent', weight: 16 }}
        eventHandlers={{
          mouseover: () => setHoverSlug(slug),
          mouseout: () => setHoverSlug(null),
          click: () => setActiveSlug(isActive ? null : slug),
        }}
      />
      <Polyline positions={latLngPath} pathOptions={{ color: outlineColor, weight: outlineWeight }} interactive={false} />
      <Polyline positions={latLngPath} pathOptions={{ color: coreColor, weight: coreWeight }} interactive={false} />
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

export default function TrailsLayer({ trails, userId, category, resizeKey, initialViewport }: Props) {
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
  const showClusterOnly = isDynamic && zoom < CLUSTER_ZOOM;

  return (
    <MapView
      center={initialViewport?.center ?? DEFAULT_CENTER}
      zoom={initialViewport?.zoom ?? DEFAULT_ZOOM}
      className="rounded-panel h-full w-full overflow-hidden"
      resizeKey={resizeKey}
    >
      <PanToActiveEffect slug={activeSlug} bbox={(isDynamic ? activeBbox : null) ?? activeTrail?.bbox ?? null} fallbackPath={activeTrail?.path ?? []} />
      <ViewportSync trails={trails} userId={userId} category={category} />
      {isDynamic && <ViewportUrlSync />}

      {activeTrail && activeTrailPopupPosition && <ActiveTrailPopup key={activeTrail.slug} trail={activeTrail} position={activeTrailPopupPosition} />}

      {showClusterOnly ? (
        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
          {markers.map((marker) =>
            marker.center ? (
              <CircleMarker
                key={marker.id}
                center={[marker.center[1], marker.center[0]]}
                radius={6}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#A67C00', fillOpacity: 1 }}
                eventHandlers={{ click: () => setActiveSlug(activeSlug === String(marker.id) ? null : String(marker.id), marker.bbox) }}
              />
            ) : null
          )}
        </MarkerClusterGroup>
      ) : (
        lineTrails.map((trail) => {
          // 完整軌跡還沒到就先畫簡化線，載好再換掉，中間不要出現空白
          const path = tracks.get(trail.slug)?.path ?? trail.path;
          return <TrailPolylines key={trail.slug} slug={trail.slug} path={path} isActive={trail.slug === activeSlug} isHover={trail.slug === hoverSlug} />;
        })
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
