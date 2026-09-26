'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineSeries, UTCTimestamp } from 'lightweight-charts';

interface PricePoint {
  time: string;
  tokenPrice: number;
  markPrice: number;
}

export default function PreIpoPriceChart({ data }: { data: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.4)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      width: containerRef.current.clientWidth,
      height: 300,
    });

    chartRef.current = chart;

    const tokenSeries = chart.addSeries(LineSeries, {
      color: '#6C5CE7',
      lineWidth: 2,
      title: 'Token Price',
    });

    const markSeries = chart.addSeries(LineSeries, {
      color: 'rgba(255, 255, 255, 0.5)',
      lineWidth: 2,
      title: 'Mark Price',
    });

    const sorted = [...data]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map((d) => ({
        time: (new Date(d.time).getTime() / 1000) as UTCTimestamp,
        tokenPrice: d.tokenPrice,
        markPrice: d.markPrice,
      }));

    tokenSeries.setData(
      sorted.map((d) => ({ time: d.time, value: d.tokenPrice })) as any
    );

    markSeries.setData(
      sorted.map((d) => ({ time: d.time, value: d.markPrice })) as any
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border3/50 rounded-xl p-5 h-[300px] flex items-center justify-center">
        <p className="text-[13px] text-white/30">No price data available yet</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-white/50">
            <span className="w-2 h-2 rounded-full bg-accent" /> Token Price
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/50">
            <span className="w-2 h-2 rounded-full bg-white/50" /> Mark Price
          </span>
        </div>
        <span className="text-[11px] text-white/30">{data.length} data points</span>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
