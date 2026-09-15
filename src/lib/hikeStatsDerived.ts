import type { Hike } from './api/adapters/hikes';

// 週幾分布：週一到週日固定七格，即使某天次數為 0 也要出現
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function getWeekdayCounts(hikes: Pick<Hike, 'date'>[]): { weekday: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const hike of hikes) {
    // date 是 'YYYY-MM-DD'，直接 new Date() 在部分時區會跨日，固定用 UTC 解析避免落到前一天
    const weekday = new Date(`${hike.date}T00:00:00Z`).getUTCDay();
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  }
  return WEEKDAY_ORDER.map((weekday) => ({ weekday, count: counts.get(weekday) ?? 0 }));
}

// 距離區間：切細一點才看得出分布，而不是全部擠在同一格
const DISTANCE_BUCKETS = [
  { max: 3, key: 'under3' },
  { max: 5, key: '3to5' },
  { max: 8, key: '5to8' },
  { max: 12, key: '8to12' },
  { max: 20, key: '12to20' },
  { max: Infinity, key: 'over20' },
] as const;

export function getDistanceBucketCounts(hikes: Pick<Hike, 'distanceKm'>[]): { key: string; count: number }[] {
  const counts = new Map(DISTANCE_BUCKETS.map((bucket) => [bucket.key, 0]));
  for (const hike of hikes) {
    const bucket = DISTANCE_BUCKETS.find((b) => hike.distanceKm <= b.max)!;
    counts.set(bucket.key, counts.get(bucket.key)! + 1);
  }
  return DISTANCE_BUCKETS.map((bucket) => ({ key: bucket.key, count: counts.get(bucket.key)! }));
}
