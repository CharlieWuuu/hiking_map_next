'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

type Props = {
  data: { date: string; value: number }[];
  emptyLabel?: string;
  // 顯示在 y 軸左上角，例如 'km'、'次'
  unit?: string;
};

const FALLBACK_WIDTH = 400;
const HEIGHT = 160;
const MARGIN = { top: 14, right: 0, bottom: 20, left: 0 };

export default function ChartLine({ data, emptyLabel, unit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);
  const isEmpty = data.length === 0;

  // viewBox 的寬度得跟著容器實際寬度走，不然線圖只會照 FALLBACK_WIDTH 這個固定比例畫，
  // 容器變寬時兩側留白、視覺上沒有真的撐滿——用 preserveAspectRatio="none" 硬拉伸雖然簡單，
  // 但會讓圓點/座標軸文字跟著非等比變形，這裡改成量測容器寬度重畫，圖形永遠正確不失真
  const [width, setWidth] = useState(FALLBACK_WIDTH);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured) setWidth(measured);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const parsed = data.map((d) => ({ date: new Date(d.date), value: d.value }));

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${HEIGHT}`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsed, (d) => d.date) as [Date, Date])
      .range([MARGIN.left, width - MARGIN.right]);

    const maxValue = d3.max(parsed, (d) => d.value) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(maxValue, 1)])
      .nice()
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = svg
      .append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-accent)')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    const totalLength = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(800)
      .attr('stroke-dashoffset', 0);

    svg
      .append('g')
      .selectAll('circle')
      .data(parsed)
      .join('circle')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.value))
      .attr('r', 0)
      .attr('fill', 'var(--color-accent)')
      .transition()
      .delay(800)
      .duration(200)
      .attr('r', 3);

    // 資料橫跨多年時，d3 的 ticks() 會自動改用「年」為刻度單位，把每個刻度對齊到年初——
    // 固定用 %m/%d 格式化的話，這種情況下每個刻度都會印出「01/01」，看起來像壞掉。
    // 改用 d3.timeFormat 的多格式規則：只有真的落在年初/月初的刻度才顯示年/月，其餘顯示月/日，
    // 這是 d3 官方文件示範的標準寫法（multi-format time axis）
    const formatYear = d3.timeFormat('%Y');
    const formatMonth = d3.timeFormat('%Y/%m');
    const formatDay = d3.timeFormat('%m/%d');
    const multiFormat = (date: Date) => {
      if (d3.timeYear(date) < date) {
        if (d3.timeMonth(date) < date) return formatDay(date);
        return formatMonth(date);
      }
      return formatYear(date);
    };

    const xAxis = d3
      .axisBottom(x)
      .ticks(Math.min(parsed.length, 6))
      .tickSizeInner(0)
      .tickSizeOuter(0)
      .tickPadding(5)
      .tickFormat((domainValue) => multiFormat(domainValue as Date));

    svg
      .append('g')
      .attr('transform', `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(xAxis)
      .call((g) => g.select('.domain').attr('stroke', 'var(--color-background-contrary)').attr('opacity', 0.2))
      .selectAll('text')
      .attr('fill', 'var(--color-background-contrary)')
      .style('font-size', '14px');

    // 沿用 d3 axis 預設的刻度文字定位規則（tickPadding 3、text-anchor end、dy 0.32em），
    // 讓自己加的單位文字跟刻度數字完全同一套排版邏輯，不會對不齊
    const TICK_PADDING = 3;

    svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSizeInner(0).tickSizeOuter(0).tickPadding(TICK_PADDING).tickFormat(d3.format('d')))
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', 'var(--color-background-contrary)')
      .style('font-size', '14px');

    if (unit) {
      // 跟 y 軸最上面那個刻度同一條水平線、垂直置中對齊；
      // x 用文字實際寬度算出置中位置，而不是憑感覺調偏移量
      const [, axisTop] = y.range();
      const unitText = svg
        .append('text')
        .text(unit)
        .attr('y', axisTop - 4)
        .attr('dy', '0.32em')
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--color-background-contrary)')
        .attr('opacity', 0.6)
        .style('font-size', '13px');
      const textWidth = (unitText.node() as SVGTextElement).getBBox().width;
      unitText.attr('x', MARGIN.left - TICK_PADDING - textWidth / 2);
    }
  }, [data, width, unit]);

  return (
    <div ref={containerRef} className="relative min-h-0 w-full flex-1">
      <svg ref={ref} width="100%" height="100%" />
      {isEmpty && emptyLabel && <div className="text-background-contrary/60 absolute inset-0 flex items-center justify-center text-sm">{emptyLabel}</div>}
    </div>
  );
}
