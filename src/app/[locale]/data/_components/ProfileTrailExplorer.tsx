'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import TrailsLayer, { type MapTrail } from '../../../../components/MapView/TrailsLayer';
import type { EditableTrail } from '../../../../components/TrailEditCard';
import { deleteHikeAction, updateHikeAction } from '../../../../lib/db/hikes.actions';
import { fetchHikePageInfo, fetchHikesPage, fetchMountains } from '../../../../lib/db/hikes.query.actions';
import type { Mountain } from '../../../../lib/db/mountains';
import { useMapStore } from '../../../../lib/mapStore';
import ExpandToggleButton from './ExpandToggleButton';
import TrailExplorerList from './TrailExplorerList';
import TrailExplorerToolbar from './TrailExplorerToolbar';
import TrailListPagination from './TrailListPagination';

type Trail = EditableTrail & Pick<MapTrail, 'path' | 'trackUrl' | 'bbox'> & { categoryNames?: string[] };

const PAGE_SIZE = 20;

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

// 後端回傳的是簡化過的 MultiLineString，這裡只取第一條線來畫圖
function getHikePath(geojson: object | null | undefined): [number, number][] {
  if (!geojson || !('type' in geojson) || !('coordinates' in geojson)) return [];
  if (geojson.type === 'LineString') return geojson.coordinates as [number, number][];
  if (geojson.type === 'MultiLineString') return (geojson.coordinates as [number, number][][])[0] ?? [];
  return [];
}

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
  const t = useTranslations('ProfileDataPage');
  const [trails, setTrails] = useState(initialTrails);
  // hover/選取狀態放在 map store，清單與地圖不必再靠 props 互相轉發
  const activeSlug = useMapStore((state) => state.activeSlug);
  const setHoverSlug = useMapStore((state) => state.setHoverSlug);
  const setActiveSlug = useMapStore((state) => state.setActiveSlug);
  const [view, setView] = useState<'card' | 'table'>('card');
  const [mountains, setMountains] = useState<Mountain[]>([]);

  // 卡片展開顯示山頭名字才需要，晚點抓不影響清單本身的顯示
  useEffect(() => {
    fetchMountains()
      .then(setMountains)
      .catch(() => {});
  }, []);

  // cursor 分頁天生只能往後走，要能往前翻頁就得自己記住走過的每一頁的 cursor。
  // cursorsByPage[p] = 「取得第 p 頁」要送出的 cursor；第 1 頁固定是 undefined，
  // 第 p+1 頁的 cursor 要等實際載入第 p 頁、拿到它的 nextCursor 後才知道
  const [page, setPage] = useState(1);
  const [cursorsByPage, setCursorsByPage] = useState<Record<number, string | undefined>>({
    1: undefined,
    2: initialNextCursor ?? undefined,
  });
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  async function goToPage(nextPage: number, cursorOverride?: string) {
    const clamped = Math.min(Math.max(nextPage, 1), pageCount);
    if (clamped === page) return;
    // 還沒走過的頁面，cursor 不存在，代表使用者用不到的按鈕（分頁 UI 本來就會 disable 掉這種情況）
    // 但如果是從地圖點擊跳頁進來的，cursor 是後端算好直接帶進來的，不受限於這個規則
    if (!(clamped in cursorsByPage) && cursorOverride === undefined) return;

    setIsLoadingPage(true);
    try {
      const cursor = cursorOverride ?? cursorsByPage[clamped];
      const result = await fetchHikesPage(PAGE_SIZE, cursor, category);
      setTrails(
        result.items.map((hike) => ({
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
          path: getHikePath(hike.geojson),
          trackUrl: hike.trackUrl,
          bbox: hike.bbox,
        }))
      );
      setPage(clamped);
      if (result.nextCursor !== null || clamped + 1 <= pageCount) {
        setCursorsByPage((prev) => ({ ...prev, [clamped + 1]: result.nextCursor ?? undefined }));
      }
    } finally {
      setIsLoadingPage(false);
    }
  }

  // 地圖上點了一條不在目前這頁的路線時，先問後端它在第幾頁，再跳過去，讓清單自動捲到那筆資料
  useEffect(() => {
    if (!activeSlug) return;
    if (trails.some((trail) => trail.slug === activeSlug)) return;

    let cancelled = false;
    fetchHikePageInfo(Number(activeSlug), PAGE_SIZE).then((info) => {
      if (cancelled || !info) return;
      void goToPage(info.page, info.cursor ?? undefined);
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
    setTrails((prev) =>
      prev.map((trail) =>
        trail.slug === slug
          ? // Server Action 只回傳成功與否，直接套用剛送出的內容即可——
            // 資料庫實際存的就是這些值，重新整理後也會一致
            { ...trail, ...patch }
          : trail
      )
    );
  }

  async function deleteTrail(slug: string) {
    const deleted = await deleteHikeAction(Number(slug));
    if (!deleted.ok) throw new Error(deleted.error);
    setTrails((prev) => prev.filter((trail) => trail.slug !== slug));
    if (activeSlug === slug) setActiveSlug(null);
    // 刪除後總數變了，簡單起見重新載入目前這頁
    void goToPage(page);
  }

  return (
    <div className={`flex h-full min-h-0 w-full gap-4 ${isMapFullscreen || isTableFullscreen ? '' : 'flex-col lg:flex-row'}`}>
      {!isMapFullscreen && (
        <div className={`flex min-h-0 w-full flex-col gap-2 ${isTableFullscreen ? '' : 'lg:max-w-md lg:shrink-0'}`}>
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
        <div className={`relative ${isMapFullscreen ? 'h-125 w-full lg:h-full' : 'h-100 w-full flex-1 lg:h-full'}`}>
          <div className="absolute top-2 right-2 z-1000">
            <ExpandToggleButton
              isExpanded={isMapFullscreen}
              onToggle={() => onFullscreenChange(isMapFullscreen ? null : 'map')}
              label={isMapFullscreen ? t('collapse') : t('expand')}
            />
          </div>
          <TrailsLayer userId={userId} category={category} resizeKey={fullscreen} initialViewport={initialViewport ?? undefined} />
        </div>
      )}
    </div>
  );
}
