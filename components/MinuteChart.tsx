
import React, { useEffect, useRef, useMemo } from 'react';
import { MinuteData } from '../types';

interface MinuteChartProps {
  data: MinuteData[];
  basePrice: number;
}

const MinuteChart: React.FC<MinuteChartProps> = ({ data, basePrice }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  // 1. 生成全天固定的 241 个时间点 (09:30-11:30, 13:00-15:00)
  const fullTimeLabels = useMemo(() => {
    const labels: string[] = [];
    // 上午 09:30 - 11:30 (121个点)
    for (let i = 0; i <= 120; i++) {
      const h = 9 + Math.floor((30 + i) / 60);
      const m = (30 + i) % 60;
      labels.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    // 下午 13:01 - 15:00 (120个点)
    for (let i = 1; i <= 120; i++) {
      const h = 13 + Math.floor(i / 60);
      const m = i % 60;
      labels.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    return labels;
  }, []);

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
    if (!chartInstance.current || !data) return;
    const validBase = basePrice || (data.length > 0 ? data[0].price : 0);
    
    // 2. 将当前数据填充到 241 个位置中，后续位置为 null
    const priceData = new Array(241).fill(null);
    const avgPriceData = new Array(241).fill(null);
    const volumeSeriesData = new Array(241).fill(null);

    data.forEach((item, index) => {
      if (index < 241) {
        priceData[index] = item.price;
        avgPriceData[index] = item.avgPrice;
        
        // 成交量颜色逻辑
        const prevPrice = index === 0 ? validBase : data[index - 1].price;
        let color = '#94a3b8'; 
        if (item.price > prevPrice) color = '#ef4444';
        else if (item.price < prevPrice) color = '#22c55e';

        volumeSeriesData[index] = {
          value: item.volume,
          itemStyle: { color }
        };
      }
    });

    const option = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#475569', type: 'dashed' } },
        confine: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc' },
        formatter: (params: any[]) => {
          const dataIndex = params[0]?.dataIndex;
          if (dataIndex === undefined || dataIndex >= data.length) return '';
          
          const item = data[dataIndex];
          const change = ((item.price - validBase) / validBase) * 100;
          const color = item.price >= validBase ? '#ef4444' : '#22c55e';
          
          return `
            <div style="font-size: 12px; font-family: monospace; min-width: 130px; line-height: 1.6;">
              <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 4px; color: #94a3b8;">时间: ${item.time}</div>
              <div>当前价格: <span style="float: right; font-weight: bold; color: ${color}">${item.price.toFixed(2)}</span></div>
              <div>当日涨跌: <span style="float: right; color: ${color}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span></div>
              <div style="color: #94a3b8; margin-top: 2px;">成交均价: <span style="float: right;">${item.avgPrice.toFixed(2)}</span></div>
              <div style="color: #94a3b8;">成交量: <span style="float: right;">${item.volume.toLocaleString()}</span></div>
            </div>
          `;
        }
      },
      grid: [
        { left: '45', right: '15', height: '60%', top: '5%' },
        { left: '45', right: '15', top: '75%', height: '15%' }
      ],
      xAxis: [
        { 
          type: 'category', 
          gridIndex: 0,
          data: fullTimeLabels, 
          axisLabel: { 
            show: true,
            interval: (index: number) => [0, 60, 120, 180, 240].includes(index),
            formatter: (value: string, index: number) => {
              if (index === 120) return '11:30/13:00';
              return value;
            },
            color: '#64748b',
            fontSize: 10
          },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#334155' } },
          splitLine: { 
            show: true, 
            interval: 60,
            lineStyle: { color: '#1e293b', type: 'dashed' } 
          }
        },
        { 
          type: 'category', 
          gridIndex: 1,
          data: fullTimeLabels, 
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#334155' } }
        }
      ],
      yAxis: [
        { 
          type: 'value', 
          gridIndex: 0,
          scale: true, 
          axisLabel: { 
            color: (val: number) => {
               if (val > validBase) return '#ef4444';
               if (val < validBase) return '#22c55e';
               return '#94a3b8';
            }, 
            fontSize: 9,
            formatter: (val: number) => val.toFixed(2)
          },
          splitLine: { lineStyle: { color: '#1e293b' } } 
        },
        { 
          type: 'value', 
          gridIndex: 1,
          show: false
        }
      ],
      series: [
        {
          name: '当前价格',
          type: 'line', 
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: priceData, 
          smooth: true, 
          showSymbol: false,
          connectNulls: false, // 关键：不连接 null 值，实现向右延伸效果
          lineStyle: { width: 1.5, color: '#3b82f6' },
          areaStyle: { 
            color: new (window as any).echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ])
          }
        },
        {
          name: '分时均价',
          type: 'line', 
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: avgPriceData, 
          smooth: true, 
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 1, color: '#eab308', opacity: 0.6 }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumeSeriesData
        }
      ]
    };
    chartInstance.current.setOption(option, true);
  }, [data, basePrice, fullTimeLabels]);

  return <div ref={chartRef} className="w-full h-[180px] md:h-[280px]" />;
};

export default MinuteChart;
