'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

type Props = {
  data: { label: string; value: number }[];
  emptyLabel?: string;
};

const CELL_GAP = 4;
const ROWS = 6; // 半年一欄，垂直 6 格
const LABEL_HEIGHT = 16;
const MIN_CELL_SIZE = 20;
const MAX_CELL_SIZE = 28;

export default function ChartHeatmap({ data, emptyLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);
  const isEmpty = data.every((d) => d.value === 0);
  const dataColumnCount = Math.ceil(data.length / ROWS);

  // 容器實際寬度量出來後，反推塞得下幾欄、每格多大——資料不夠塞滿寬度時，
  // 左側用灰格子（value 為 null）補滿，讓最新一欄永遠貼齊容器右緣
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured) setContainerWidth(measured);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const cellSize = containerWidth
    ? Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, (containerWidth + CELL_GAP) / Math.max(dataColumnCount, 1) - CELL_GAP))
    : MAX_CELL_SIZE;
  const columnCount = containerWidth ? Math.max(dataColumnCount, Math.floor((containerWidth + CELL_GAP) / (cellSize + CELL_GAP))) : dataColumnCount;
  const padCount = Math.max(0, columnCount * ROWS - data.length);
  const paddedData: { label: string; value: number | null }[] = [...Array.from({ length: padCount }, () => ({ label: '', value: null })), ...data];

  const width = columnCount * (cellSize + CELL_GAP) - CELL_GAP;
  const height = ROWS * (cellSize + CELL_GAP) - CELL_GAP + LABEL_HEIGHT;

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${Math.max(width, 1)} ${height}`);

    // d3 對 CSS 變數字串不會做顏色插值（只有實際色碼字串才行），
    // 所以先用 getComputedStyle 把 var(--color-*) resolve 成當前主題下的實際色碼
    const computed = getComputedStyle(ref.current);
    // panel 到 panel-active 是一整級跳動，太搶眼；混出兩者之間、僅比卡片背景淺一點點的顏色
    const panelColor = computed.getPropertyValue('--color-panel').trim();
    const panelActiveColor = computed.getPropertyValue('--color-panel-active').trim();
    const emptyColor = d3.interpolateRgb(panelColor, panelActiveColor)(0.35);
    const fullColor = computed.getPropertyValue('--color-accent').trim();

    // GitHub 貢獻圖風格：固定 5 級色階（含全空），而非連續漸層
    const LEVELS = 5;
    const levelColor = d3
      .scaleLinear<string>()
      .domain([0, LEVELS - 1])
      .range([emptyColor, fullColor])
      .interpolate(d3.interpolateRgb);
    const maxValue = d3.max(data, (d) => d.value) ?? 0;
    const level = d3
      .scaleQuantize<number>()
      .domain([0, Math.max(maxValue, 1)])
      .range(d3.range(LEVELS));
    const color = (value: number | null) => (!value ? emptyColor : levelColor(Math.max(level(value), 1)));

    // 時間軸由左到右推進：每欄代表半年，欄內由上到下是該半年的第 1~6 個月；
    // 左側補的灰格子（value 為 null）沒有實際月份，佔位撐滿寬度但不列入年份標籤
    const cell = svg
      .append('g')
      .selectAll('g')
      .data(paddedData)
      .join('g')
      .attr('transform', (_, i) => {
        const col = Math.floor(i / ROWS);
        const row = i % ROWS;
        return `translate(${col * (cellSize + CELL_GAP)}, ${row * (cellSize + CELL_GAP)})`;
      });

    cell
      .append('rect')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 6)
      .attr('fill', 'var(--color-panel)')
      .transition()
      .duration(600)
      .delay((_, i) => i * 15)
      .attr('fill', (d) => color(d.value));

    cell
      .filter((d) => d.value !== null)
      .append('title')
      .text((d) => `${d.label}: ${d.value}`);

    // label 是 'YYYY-MM' 完整日期字串，塞在小方塊上方會擠爆看不清楚，
    // 只在每年 1 月那一欄（每年的第一欄）標一次年份，7 月欄不重複標籤
    const yearLabels = paddedData.map((d, i) => ({ ...d, col: Math.floor(i / ROWS) })).filter((d, i) => i % ROWS === 0 && d.label.endsWith('-01'));
    svg
      .append('g')
      .selectAll('text')
      .data(yearLabels)
      .join('text')
      .text((d) => d.label.slice(0, 4))
      .attr('x', (d) => d.col * (cellSize + CELL_GAP) + cellSize / 2)
      .attr('y', ROWS * (cellSize + CELL_GAP) - CELL_GAP + LABEL_HEIGHT - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-background-contrary)')
      .attr('opacity', 0.6)
      .style('font-size', '11px');
  }, [paddedData, cellSize, width, height]);

  return (
    <div ref={containerRef} className="relative min-h-0 w-full flex-1 px-4">
      <svg ref={ref} width={width} height={height} />
      {isEmpty && emptyLabel && <div className="text-background-contrary/60 absolute inset-0 flex items-center justify-center text-sm">{emptyLabel}</div>}
    </div>
  );
}
