'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

type Props = {
  data: { label: string; value: number }[];
  emptyLabel?: string;
  // 顯示在 y 軸左上角，例如 'km'、'次'
  unit?: string;
  // x 軸標籤本身就帶單位時（例如距離區間），改把單位獨立顯示在 x 軸最後面，而不是重複印在每個標籤上
  xAxisUnit?: string;
};

const WIDTH = 400;
const HEIGHT = 140;
const MARGIN = { top: 14, right: 5, bottom: 20, left: 18 };
const MAX_BAR_WIDTH = 40;

export default function ChartBar({ data, emptyLabel, unit, xAxisUnit }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const isEmpty = data.every((d) => d.value === 0);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([MARGIN.left, WIDTH - MARGIN.right])
      .padding(0.1);

    const maxValue = d3.max(data, (d) => d.value) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(maxValue, 1)])
      .nice()
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

    // 類別數少時 bandwidth 會被拉得很寬，長條看起來像色塊；限制最大寬度、置中在各自的 band 裡
    const barWidth = Math.min(x.bandwidth(), MAX_BAR_WIDTH);
    const barOffset = (x.bandwidth() - barWidth) / 2;

    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.label)! + barOffset)
      .attr('y', y(0))
      .attr('width', barWidth)
      .attr('height', 0)
      .attr('fill', 'var(--color-accent)')
      .transition()
      .duration(800)
      .delay((_, i) => i * 20)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => y(0) - y(d.value));

    const xAxis = d3.axisBottom(x).tickSizeInner(0).tickSizeOuter(0).tickPadding(5);

    const xAxisGroup = svg
      .append('g')
      .attr('transform', `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(xAxis)
      .call((g) => g.select('.domain').attr('stroke', 'var(--color-background-contrary)').attr('opacity', 0.2));
    xAxisGroup.selectAll('text').attr('fill', 'var(--color-background-contrary)').style('font-size', '14px');

    if (xAxisUnit) {
      // 接在最後一個 x 軸刻度標籤右邊，跟它同一條水平線、垂直置中對齊——
      // 直接沿用該刻度 <text> 量到的 y/dy，而不是自己猜一個絕對值
      const lastTick = xAxisGroup.select<SVGGElement>('.tick:last-of-type');
      const lastLabel = lastTick.select<SVGTextElement>('text');
      const lastLabelNode = lastLabel.node();
      if (lastLabelNode) {
        const bbox = lastLabelNode.getBBox();
        lastTick
          .append('text')
          .text(xAxisUnit)
          .attr('x', bbox.x + bbox.width + 10)
          .attr('y', lastLabel.attr('y') || 0)
          .attr('dy', lastLabel.attr('dy') || '0.32em')
          .attr('text-anchor', 'start')
          .attr('fill', 'var(--color-background-contrary)')
          .attr('opacity', 0.6)
          .style('font-size', '13px');
      }
    }

    // 沿用 d3 axis 預設的刻度文字定位規則（tickPadding 3、text-anchor end、dy 0.32em），
    // 讓自己加的單位文字跟刻度數字完全同一套排版邏輯，不會對不齊
    const TICK_PADDING = 3;
    // 值域很小時（例如全為 0）取 5 個刻度會四捨五入成重複的整數，改用實際整數刻度
    const tickValues = d3.range(0, Math.floor(y.domain()[1]) + 1).filter((_, i, arr) => arr.length <= 4 || i % Math.ceil(arr.length / 4) === 0);

    const yAxisGroup = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).tickValues(tickValues).tickSizeInner(0).tickSizeOuter(0).tickPadding(TICK_PADDING).tickFormat(d3.format('d')));
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('text').attr('fill', 'var(--color-background-contrary)').style('font-size', '14px');

    if (unit) {
      // 跟整條 y 軸（上下範圍）垂直置中，而不是對齊某一個刻度；
      // x 用文字實際寬度算出置中位置，而不是憑感覺調偏移量
      const [axisBottom, axisTop] = y.range();
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
  }, [data, unit]);

  return (
    <div className="relative max-h-35 min-h-0 flex-1">
      <svg ref={ref} width="100%" height="100%" />
      {isEmpty && emptyLabel && <div className="text-background-contrary/60 absolute inset-0 flex items-center justify-center text-sm">{emptyLabel}</div>}
    </div>
  );
}
