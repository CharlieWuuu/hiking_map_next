import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import PageLayout from '../../../components/PageLayout';
import { findHikesPaginated } from '../../../lib/db/hikes';
import { getCurrentUser } from '../../../lib/getCurrentUser';
import { TRAIL_CATEGORIES, type TrailCategory } from '../../../testing/mocks/trails/trails.data';
import ProfileTrailExplorerWithNavigation from './_components/ProfileTrailExplorerWithNavigation';

type Props = {
  searchParams: Promise<{ fullscreen?: string; edit?: string; lat?: string; lng?: string; z?: string; category?: string }>;
};

// 後端回傳的是簡化過的 MultiLineString，這裡只取第一條線來畫圖。
// 放大到 DETAIL_ZOOM 以上時，地圖會自己去 R2 換上完整軌跡
function getHikePath(geojson: object | null | undefined): [number, number][] {
  if (!geojson || !('type' in geojson) || !('coordinates' in geojson)) return [];
  if (geojson.type === 'LineString') return geojson.coordinates as [number, number][];
  if (geojson.type === 'MultiLineString') return (geojson.coordinates as [number, number][][])[0] ?? [];
  return [];
}

const PAGE_SIZE = 20;

export default async function DataPage({ searchParams }: Props) {
  const { fullscreen: rawFullscreen, edit, lat, lng, z, category: rawCategory } = await searchParams;
  const fullscreen = rawFullscreen === 'map' ? 'map' : rawFullscreen === 'table' ? 'table' : null;
  const category = TRAIL_CATEGORIES.includes(rawCategory as TrailCategory) ? (rawCategory as TrailCategory) : undefined;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');
  const isOwner = true;
  const isEditMode = edit === 'true';

  // 網址帶著地圖視野走，重新整理／分享連結都能回到原本看的位置
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const parsedZoom = Number(z);
  const initialViewport =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && Number.isFinite(parsedZoom)
      ? { center: [parsedLat, parsedLng] as [number, number], zoom: parsedZoom }
      : null;

  // 清單只拿第一頁；往後翻頁由 ProfileTrailExplorer 在瀏覽器端用 cursor 逐頁向後端要，
  // 不再一次把所有紀錄（含簡化 geojson）都撈回來
  const { items: hikes, totalCount, nextCursor } = await findHikesPaginated(Number(currentUser.userId), PAGE_SIZE, undefined, true, category);
  const trails = hikes.map((hike) => ({
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
  }));

  const t = await getTranslations('ProfileDataPage');
  const tCategory = await getTranslations('SearchPage');
  const subtitle = category ? t('subtitleWithCategory', { category: tCategory(category), count: totalCount }) : t('subtitle', { count: totalCount });

  return (
    <PageLayout title={t('title')} subtitle={<span className="text-sm">{subtitle}</span>}>
      {/* 寬螢幕：地圖與清單並排，高度直接吃滿視窗剩餘空間（main 的 grid row 傳下來的高度），
          lg:min-h-0 讓它能收縮到那個高度內而不被內容撐開。
          窄螢幕：兩者上下堆疊，撐滿視窗反而會把彼此壓扁，所以保留 min-h-150 當固定高度 */}
      <div className="page-wide flex min-h-150 flex-1 flex-col lg:min-h-0">
        <ProfileTrailExplorerWithNavigation
          trails={trails}
          totalCount={totalCount}
          initialNextCursor={nextCursor}
          userId={String(currentUser.userId)}
          category={category}
          fullscreen={fullscreen}
          isEditMode={isEditMode}
          isOwner={isOwner}
          initialViewport={initialViewport}
        />
      </div>
    </PageLayout>
  );
}
