type MonthlyDistance = { month: string; distanceKm: number };

// 後端只回傳有紀錄的月份，缺月份會直接缺席而非 0，這裡補齊最近 N 個月的區間
export function fillMonthlyDistance(data: MonthlyDistance[], monthsCount: number): MonthlyDistance[] {
  const byMonth = new Map(data.map((d) => [d.month, d.distanceKm]));
  const now = new Date();
  const months: MonthlyDistance[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({ month, distanceKm: byMonth.get(month) ?? 0 });
  }

  return months;
}

// 熱度圖等頁面要看完整歷史，且每欄（例如半年一欄）要從 1 月對齊才好讀，
// 所以固定從「最早紀錄那一年的 1 月」開始排到現在，而非用 fillMonthlyDistance 那種「從現在往前推 N 個月」的算法
// （往前推無法保證起點落在 1 月，取決於現在是幾月）
export function fillMonthlyDistanceFromFirstYear(data: MonthlyDistance[]): MonthlyDistance[] {
  if (data.length === 0) return [];

  const byMonth = new Map(data.map((d) => [d.month, d.distanceKm]));
  const earliest = data.reduce((min, d) => (d.month < min ? d.month : min), data[0].month);
  const [earliestYear] = earliest.split('-').map(Number);

  const now = new Date();
  const months: MonthlyDistance[] = [];
  for (let year = earliestYear; year <= now.getFullYear(); year++) {
    const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let m = 1; m <= lastMonth; m++) {
      const month = `${year}-${String(m).padStart(2, '0')}`;
      months.push({ month, distanceKm: byMonth.get(month) ?? 0 });
    }
  }

  return months;
}
