'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import type { OverlayKey } from '../../../../components/MapView/LayerSwitcher';
import TrailsLayer, { type MapTrail } from '../../../../components/MapView/TrailsLayer';
import type { EditableTrail } from '../../../../components/TrailEditCard';
import type { Hike } from '../../../../lib/db/hikes';
import { deleteHikeAction, updateHikeAction } from '../../../../lib/db/hikes.actions';
import { fetchHikePageInfo, fetchHikesPage } from '../../../../lib/db/hikes.query.actions';
import type { Mountain } from '../../../../lib/db/mountains';
import { toSegments } from '../../../../lib/geojsonSegments';
import { useMapStore } from '../../../../lib/mapStore';
import { invalidateHikeQueries, QUERY_KEYS, useMountains, useReferenceLayers } from '../../../../lib/queries';
import { PAGE_SIZE } from '../constants';
import ExpandToggleButton from './ExpandToggleButton';
import TrailExplorerList from './TrailExplorerList';
import TrailExplorerToolbar from './TrailExplorerToolbar';
import TrailListPagination from './TrailListPagination';

type Trail = EditableTrail & Pick<MapTrail, 'path' | 'trackUrl' | 'bbox'> & { categoryNames?: string[] };

// 一頁的資料連同「下一頁的 cursor」一起快取，翻回來時不必重抓也知道怎麼往後翻
type TrailPage = { page: number; items: Trail[]; nextCursor: string | null };

const NO_MOUNTAINS: Mountain[] = [];

function toTrail(hike: Hike): Trail {
  return {
    slug: String(hike.id),
    name: hike.name,
    county: hike.county ?? '',
    town: hike.town ?? '',
    date: hike.date,
    distanceKm: hike.distanceKm,
    isPublic: hike.isPublic,
    mountainIds: hike.mountainIds ?? [],
    categoryNames: hike.categoryNames ?? [],
    urls: hike.urls,
    note: hike.note ?? undefined,
    path: toSegments(hike.geojson),
    trackUrl: hike.trackUrl,
    bbox: hike.bbox,
  };
}

type Props = {
  trails: Trail[];
  totalCount: number;
  initialNextCursor: string | null;
  userId: string;
  category?: string;
  fullscreen: 'map' | 'table' | null;
  isEditMode: boolean;
  isOwner: boolean;
  onFullscreenChange: (next: 'map' | 'table' | null) => void;
  onToggleEditMode: () => void;
  initialViewport: { center: [number, number]; zoom: number } | null;
};

export default function ProfileTrailExplorer({
  trails: initialTrails,
  totalCount,
  initialNextCursor,
  userId,
  category,
  fullscreen,
  isEditMode,
  isOwner,
  onFullscreenChange,
  onToggleEditMode,
  initialViewport,
}: Props) {
  // 官方名單疊圖：資料量不小（百大必訪的簡化幾何合計約 435KB），
  // 所以不隨頁面一起送，等使用者第一次打開任一圖層才去要，之後由 SWR 快取，換頁回來也不重抓。
  // 「我的軌跡」也是一個圖層，預設開著；三個官方名單預設關著。
  // 疊放順序固定，重疊處靠各層自己的透明度分辨，比調整順序直覺
  const layerOrder: OverlayKey[] = ['hike', 'hundredTrail', 'hundred', 'smallHundred'];
  const [layerOpacity, setLayerOpacity] = useState<Record<OverlayKey, number>>({
    hike: 1,
    hundred: 1,
    smallHundred: 1,
    hundredTrail: 1,
  });
  const [visibleLayers, setVisibleLayers] = useState<Record<OverlayKey, boolean>>({
    hike: true,
    hundred: false,
    smallHundred: false,
    hundredTrail: false,
  });
  // 點開過任一官方名單圖層後才開始抓，之後關掉圖層也留著資料
  const [wantsReferenceLayers, setWantsReferenceLayers] = useState(false);
  const { data: referenceLayersData, isLoading: isLoadingLayers } = useReferenceLayers(userId, wantsReferenceLayers);
  const referenceLayers = referenceLayersData ?? null;

  function handleToggleLayer(key: OverlayKey) {
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }));
    // 「我的軌跡」不需要載入官方名單
    if (key !== 'hike') setWantsReferenceLayers(true);
  }

  const layerCounts: Record<OverlayKey, { completed: number; total: number } | null> = {
    // 自己的紀錄沒有「完成幾／共幾」的概念，只顯示總數
    hike: { completed: totalCount, total: totalCount },
    hundred: referenceLayers ? { completed: referenceLayers.hundred.filter((x) => x.completed).length, total: referenceLayers.hundred.length } : null,
    smallHundred: referenceLayers
      ? { completed: referenceLayers.smallHundred.filter((x) => x.completed).length, total: referenceLayers.smallHundred.length }
      : null,
    hundredTrail: referenceLayers
      ? { completed: referenceLayers.hundredTrail.filter((x) => x.completed).length, total: referenceLayers.hundredTrail.length }
      : null,
  };

  const t = useTranslations('ProfileDataPage');
  const tCategory = useTranslations('SearchPage');
  const tMapLayer = useTranslations('MapLayerToggle');
  // hover/選取狀態放在 map store，清單與地圖不必再靠 props 互相轉發
  const activeSlug = useMapStore((state) => state.activeSlug);
  const setHoverSlug = useMapStore((state) => state.setHoverSlug);
  const setActiveSlug = useMapStore((state) => state.setActiveSlug);
  const invalidateHikeDetail = useMapStore((state) => state.invalidateHikeDetail);
  const [view, setView] = useState<'card' | 'table'>('card');
  // 卡片展開顯示山頭名字才需要，晚點抓不影響清單本身的顯示
  const { data: mountains = NO_MOUNTAINS } = useMountains();

  // cursor 分頁天生只能往後走，要能往前翻頁就得自己記住走過的每一頁的 cursor。
  // cursorsByPage[p] = 「取得第 p 頁」要送出的 cursor；第 1 頁固定是 undefined，
  // 第 p+1 頁的 cursor 要等實際載入第 p 頁、拿到它的 nextCursor 後才知道
  const [page, setPage] = useState(1);
  const [cursorsByPage, setCursorsByPage] = useState<Record<number, string | undefined>>({
    1: undefined,
    2: initialNextCursor ?? undefined,
  });

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 分頁資料交給 SWR：同一次造訪內來回翻頁不重抓。
  // key 帶一個「這次掛載」專屬的識別，快取不跨造訪——第 1 頁每次進來都由伺服器給最新的，
  // 跨造訪沿用舊快取反而會拿到過期資料，也會跟這次掛載才開始累積的 cursorsByPage 對不上
  const [visitId] = useState(() => crypto.randomUUID());
  const pageKey = QUERY_KEYS.hikePage(`${userId}:${visitId}`, category, page, cursorsByPage[page]);
  const {
    data: pageData,
    isLoading: isLoadingPage,
    mutate: mutatePage,
  } = useSWR<TrailPage>(
    pageKey,
    async () => {
      const result = await fetchHikesPage(PAGE_SIZE, cursorsByPage[page], category);
      return { page, items: result.items.map(toTrail), nextCursor: result.nextCursor };
    },
    {
      // 第 1 頁直接用伺服器給的資料，不重抓；其他頁沒有快取時才抓
      fallbackData: page === 1 ? { page: 1, items: initialTrails, nextCursor: initialNextCursor } : undefined,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // 載入下一頁期間先留著上一頁（半透明），清單不會閃一下變空
      keepPreviousData: true,
      // 拿到這頁的 nextCursor 後記下來，下一頁的按鈕才翻得過去
      onSuccess: (data) => {
        if (data.nextCursor !== null || data.page + 1 <= pageCount) {
          setCursorsByPage((prev) => ({ ...prev, [data.page + 1]: data.nextCursor ?? undefined }));
        }
      },
    }
  );
  const trails = pageData?.items ?? initialTrails;

  function goToPage(nextPage: number, cursorOverride?: string) {
    const clamped = Math.min(Math.max(nextPage, 1), pageCount);
    if (clamped === page) return;
    // 還沒走過的頁面，cursor 不存在，代表使用者用不到的按鈕（分頁 UI 本來就會 disable 掉這種情況）
    // 但如果是從地圖點擊跳頁進來的，cursor 是後端算好直接帶進來的，不受限於這個規則
    if (!(clamped in cursorsByPage) && cursorOverride === undefined) return;
    if (cursorOverride !== undefined) setCursorsByPage((prev) => ({ ...prev, [clamped]: cursorOverride }));
    setPage(clamped);
  }

  // 地圖上點了一條不在目前這頁的路線時，先問後端它在第幾頁，再跳過去，讓清單自動捲到那筆資料
  useEffect(() => {
    if (!activeSlug) return;
    if (trails.some((trail) => trail.slug === activeSlug)) return;

    let cancelled = false;
    fetchHikePageInfo(Number(activeSlug), PAGE_SIZE).then((info) => {
      if (cancelled || !info) return;
      goToPage(info.page, info.cursor ?? undefined);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  const isMapFullscreen = fullscreen === 'map';
  const isTableFullscreen = fullscreen === 'table';

  async function saveTrailPatch(slug: string, patch: Partial<EditableTrail>) {
    const result = await updateHikeAction(Number(slug), patch);
    if (!result.ok) throw new Error(result.error);
    // 地圖浮現卡的詳情快取也要丟掉，不然卡片還是舊名稱、舊縣市
    invalidateHikeDetail(slug);
    // Server Action 只回傳成功與否，直接把剛送出的內容套進這頁的快取即可——
    // 資料庫實際存的就是這些值，不必為了這頁再重抓一次
    await mutatePage((current) => current && { ...current, items: current.items.map((trail) => (trail.slug === slug ? { ...trail, ...patch } : trail)) }, {
      revalidate: false,
    });
    // 其他頁、官方名單的完成狀態等可能跟著變了（例如改了山頭），這頁已經是新的就不必重抓
    void invalidateHikeQueries(pageKey);
  }

  async function deleteTrail(slug: string) {
    const deleted = await deleteHikeAction(Number(slug));
    if (!deleted.ok) throw new Error(deleted.error);
    invalidateHikeDetail(slug);
    if (activeSlug === slug) setActiveSlug(null);
    // 先把這筆從畫面拿掉，再讓這頁與其他相關快取重抓：刪除後後面的資料會往前補位，總數也變了
    await mutatePage((current) => current && { ...current, items: current.items.filter((trail) => trail.slug !== slug) }, { revalidate: false });
    void invalidateHikeQueries();
  }

  return (
    <div className={`flex h-full min-h-0 w-full gap-4 ${isMapFullscreen || isTableFullscreen ? '' : 'flex-col lg:flex-row'}`}>
      {!isMapFullscreen && (
        <div className={`flex min-h-0 w-full flex-1 flex-col gap-2 ${isTableFullscreen ? '' : 'lg:max-w-md lg:flex-none'}`}>
          <div className={`rounded-panel flex min-h-0 w-full flex-col gap-2 overflow-hidden lg:h-full`}>
            <TrailExplorerToolbar
              isTableExpanded={isTableFullscreen}
              onToggleTableExpanded={() => onFullscreenChange(isTableFullscreen ? null : 'table')}
              view={view}
              onToggleView={() => setView((prev) => (prev === 'card' ? 'table' : 'card'))}
              isOwner={isOwner}
              isEditMode={isEditMode}
              onToggleEditMode={onToggleEditMode}
            />

            {/* 只有清單捲動，工具列與分頁才會一直留在畫面上 */}
            <div className={`scrollbar-subtle flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto ${isLoadingPage ? 'opacity-50' : ''}`}>
              <TrailExplorerList
                trails={trails}
                view={view}
                activeSlug={activeSlug}
                isEditMode={isEditMode}
                mountains={mountains}
                onHoverChange={setHoverSlug}
                onSelect={setActiveSlug}
                onSaveTrailPatch={saveTrailPatch}
                onDeleteTrail={deleteTrail}
              />
            </div>
          </div>
          <TrailListPagination page={page} pageCount={pageCount} onPageChange={goToPage} />
        </div>
      )}

      {!isTableFullscreen && (
        <div className={`relative ${isMapFullscreen ? 'h-full w-full' : 'h-[50dvh] w-full shrink-0 lg:h-full lg:flex-1 lg:shrink'}`}>
          <div className="absolute top-2 right-2 z-1000">
            <ExpandToggleButton
              isExpanded={isMapFullscreen}
              onToggle={() => onFullscreenChange(isMapFullscreen ? null : 'map')}
              label={isMapFullscreen ? t('collapse') : t('expand')}
            />
          </div>
          <TrailsLayer
            userId={userId}
            category={category}
            resizeKey={fullscreen}
            initialViewport={initialViewport ?? undefined}
            referenceLayers={referenceLayers}
            visibleLayers={visibleLayers}
            layerOpacity={layerOpacity}
            overlays={{
              order: layerOrder,
              visible: visibleLayers,
              counts: layerCounts,
              isLoading: isLoadingLayers,
              opacity: layerOpacity,
              onToggle: handleToggleLayer,
              onOpacityChange: (key, value) => setLayerOpacity((prev) => ({ ...prev, [key]: value })),
              labels: {
                hike: tMapLayer('myTracks'),
                hundred: tCategory('hundred'),
                smallHundred: tCategory('smallHundred'),
                hundredTrail: tCategory('hundredTrail'),
              },
              loadingLabel: tMapLayer('loading'),
              title: tMapLayer('title'),
            }}
          />
        </div>
      )}
    </div>
  );
}
