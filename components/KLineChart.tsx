
import React, { useEffect, useRef } from 'react';
import { KLine } from '../types';

interface KLineChartProps {
  data: KLine[];
  visibleCount: number;
}

const KLineChart: React.FC<KLineChartProps> = ({ data, visibleCount }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    const echarts = (window as any).echarts;
    if (!chartRef.current || !echarts) return;
    chartInstance.current = echarts.init(chartRef.current);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) chartInstance.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || !data || data.length === 0) return;
    
    const displayedData = data.slice(0, Math.min(visibleCount, data.length));
    const dates = displayedData.map(d => d.date);
    const values = displayedData.map(d => [d.open, d.close, d.low, d.high]);

    const option = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { 
          type: 'cross',
          lineStyle: { color: '#475569', width: 1 }
        },
        confine: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          
          const dataIndex = params[0].dataIndex;
          const curr = displayedData[dataIndex];
          if (!curr) return '';
          
          const prev = dataIndex > 0 ? displayedData[dataIndex - 1] : null;
          
          let changeHtml = '';
          if (prev) {
            const change = ((curr.close - prev.close) / prev.close) * 100;
            const color = change >= 0 ? '#ef4444' : '#22c55e';
            changeHtml = `<div>涨跌幅: <span style="float: right; margin-left: 20px; color: ${color}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span></div>`;
          }

          const ma5 = params.find(x => x.seriesName === '5日均线')?.value;
          const ma10 = params.find(x => x.seriesName === '10日均线')?.value;
          const ma20 = params.find(x => x.seriesName === '20日均线')?.value;
          const ma60 = params.find(x => x.seriesName === '60日均线')?.value;

          return `
            <div style="font-size: 11px; font-family: monospace; min-width: 160px; line-height: 1.5;">
              <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 4px; color: #94a3b8;">${curr.date}</div>
              <div style="color: ${curr.close >= curr.open ? '#ef4444' : '#22c55e'}">
                <div>收盘: <span style="float: right; font-weight: bold;">${curr.close.toFixed(2)}</span></div>
                <div>开盘: <span style="float: right;">${curr.open.toFixed(2)}</span></div>
                <div>最高: <span style="float: right;">${curr.high.toFixed(2)}</span></div>
                <div>最低: <span style="float: right;">${curr.low.toFixed(2)}</span></div>
              </div>
              ${changeHtml}
              <div style="margin-top: 4px; border-top: 1px solid #334155; padding-top: 4px;">
                <div style="color: #eab308">MA5: <span style="float: right;">${typeof ma5 === 'number' ? ma5.toFixed(2) : '--'}</span></div>
                <div style="color: #3b82f6">MA10: <span style="float: right;">${typeof ma10 === 'number' ? ma10.toFixed(2) : '--'}</span></div>
                <div style="color: #a855f7">MA20: <span style="float: right;">${typeof ma20 === 'number' ? ma20.toFixed(2) : '--'}</span></div>
                <div style="color: #94a3b8">MA60: <span style="float: right;">${typeof ma60 === 'number' ? ma60.toFixed(2) : '--'}</span></div>
              </div>
            </div>
          `;
        }
      },
      grid: [
        { left: '45', right: '15', height: '75%', top: '5%' },
        { left: '45', right: '15', top: '85%', height: '10%' }
      ],
      xAxis: [
        { 
          type: 'category', 
          gridIndex: 0, 
          data: dates, 
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        { type: 'category', gridIndex: 1, data: dates, axisLabel: { show: false }, axisTick: { show: false } }
      ],
      yAxis: [
        { 
          gridIndex: 0, 
          scale: true, 
          axisLine: { show: false }, 
          splitLine: { lineStyle: { color: '#1e293b' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        { gridIndex: 1, show: false }
      ],
      series: [
        {
          name: '日K', 
          type: 'candlestick', 
          data: values,
          itemStyle: { 
            color: '#ef4444', 
            color0: '#22c55e', 
            borderColor: '#ef4444', 
            borderColor0: '#22c55e' 
          }
        },
        { 
          name: '5日均线', 
          type: 'line', 
          data: displayedData.map(d => d.ma5), 
          smooth: true, 
          showSymbol: false, 
          lineStyle: { width: 1, color: '#eab308' } 
        },
        { 
          name: '10日均线', 
          type: 'line', 
          data: displayedData.map(d => d.ma10), 
          smooth: true, 
          showSymbol: false, 
          lineStyle: { width: 1, color: '#3b82f6' } 
        },
        { 
          name: '20日均线', 
          type: 'line', 
          data: displayedData.map(d => d.ma20), 
          smooth: true, 
          showSymbol: false, 
          lineStyle: { width: 1, color: '#a855f7' } 
        },
        { 
          name: '60日均线', 
          type: 'line', 
          data: displayedData.map(d => d.ma60), 
          smooth: true, 
          showSymbol: false, 
          lineStyle: { width: 1, color: '#94a3b8', opacity: 0.8 } 
        }
      ]
    };
    chartInstance.current.setOption(option, true);
  }, [data, visibleCount]);

  return <div ref={chartRef} className="w-full h-[220px] md:h-[350px]" />;
};

export default KLineChart;
