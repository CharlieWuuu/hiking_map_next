import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import PageLayout from '../../../../components/PageLayout';
import { findMountainsByCategory } from '../../../../lib/db/mountains';
import { filterTrails } from '../../../../lib/db/search';
import { getCurrentUser } from '../../../../lib/getCurrentUser';
import { TRAIL_CATEGORIES, type TrailCategory } from '../../../../testing/mocks/trails/trails.data';
import CategoryList from './_components/CategoryList';

type Props = {
  params: Promise<{ category: string }>;
};

// 百岳／小百岳列的是山頭（要看「還有哪幾座沒爬」），
// 百大必訪步道本來就是路線層級的名單，列步道才有意義
const MOUNTAIN_CATEGORIES = new Set<TrailCategory>(['hundred', 'smallHundred']);

export default async function CategoryPage({ params }: Props) {
  const { category: raw } = await params;
  if (!TRAIL_CATEGORIES.includes(raw as TrailCategory)) notFound();
  const category = raw as TrailCategory;

  const t = await getTranslations('SearchPage');
  // 未登入也能瀏覽名單，只是不會標記完成狀態
  const currentUser = await getCurrentUser();
  const userId = currentUser ? Number(currentUser.userId) : null;

  if (MOUNTAIN_CATEGORIES.has(category)) {
    const mountains = await findMountainsByCategory(category, userId);
    return (
      <PageLayout title={t(category)}>
        <CategoryList items={mountains} />
      </PageLayout>
    );
  }

  // 百大必訪步道：沿用既有的步道查詢
  const trails = await filterTrails(category, null);
  return (
    <PageLayout title={t(category)}>
      <CategoryList
        items={trails.map((trail) => ({
          id: trail.slug,
          name: trail.displayName,
          county: trail.county ?? null,
          href: `/trails/${trail.slug}`,
        }))}
      />
    </PageLayout>
  );
}
