
import { KLine, MinuteData, StockInfo } from '../types';
import { SEED_STOCKS } from '../constants';

const PROXY_URL = 'https://api.allorigins.win/raw?url=';

export const fetchRandomStock = (): StockInfo => {
  return SEED_STOCKS[Math.floor(Math.random() * SEED_STOCKS.length)];
};

/**
 * 获取完整历史数据
 */
export const fetchHistoricalDataFromAPI = async (code: string): Promise<{ data: KLine[], startIndex: number }> => {
  try {
    const symbol = code.toLowerCase();
    const count = 1200; // 获取上限数据量
    // 增加 timestamp 防止缓存
    const apiUrl = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,${count},qfq&_=${Date.now()}`;
    
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(apiUrl)}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const rawText = await response.text();
    // 检查是否返回了 HTML (代理错误)
    if (rawText.trim().startsWith('<')) throw new Error('Proxy returned HTML');

    const parsedData = JSON.parse(rawText);
    const stockData = parsedData.data?.[symbol];
    if (!stockData) throw new Error('API Data Node Missing');
    
    const rawKData = stockData.qfqday || stockData.day;
    if (!Array.isArray(rawKData) || rawKData.length < 50) throw new Error('Data too short');

    const allData: KLine[] = rawKData.map((item: any, i: number, arr: any[]) => {
      const close = parseFloat(item[2]);
      const calculateMA = (period: number) => {
        if (i < period - 1) return undefined;
        let sum = 0;
        for(let j = 0; j < period; j++) sum += parseFloat(arr[i-j][2]);
        return parseFloat((sum / period).toFixed(2));
      };
      return {
        date: item[0],
        open: parseFloat(item[1]),
        close: close,
        high: parseFloat(item[3]),
        low: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        ma5: calculateMA(5),
        ma10: calculateMA(10),
        ma20: calculateMA(20),
        ma60: calculateMA(60)
      };
    });

    // 随机选择起点，预留至少 100 天的训练空间
    const maxStart = Math.max(0, allData.length - 120);
    const startIndex = Math.floor(Math.random() * Math.min(maxStart, 800));

    return { data: allData, startIndex };
  } catch (error) {
    console.warn('API Fetch failed, using simulation engine instead.', error);
    const fallback = generateFallbackData(800);
    return { data: fallback, startIndex: 150 };
  }
};

export const generateMinuteData = (kline: KLine): MinuteData[] => {
  const minutes: MinuteData[] = [];
  const totalPoints = 241; 
  let totalVolume = 0;
  let volumeSumPrice = 0;

  for (let i = 0; i < totalPoints; i++) {
    const progress = i / (totalPoints - 1);
    const trend = (kline.close - kline.open) * progress;
    const amplitude = (kline.high - kline.low) / kline.open;
    const volatilityRange = kline.open * Math.max(0.004, amplitude * 0.18);
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * volatilityRange;
    
    let price = kline.open + trend + noise;
    if (i === 0) price = kline.open;
    if (i === totalPoints - 1) price = kline.close;
    price = Math.max(kline.low, Math.min(kline.high, price));

    const volBase = kline.volume / totalPoints;
    const factor = (i < 20 || i > 220) ? (1.5 + Math.random()) : (0.5 + Math.random());
    let vol = Math.floor(volBase * factor);
    if (kline.volume > 0 && vol === 0) vol = 1;
    
    totalVolume += vol;
    volumeSumPrice += price * vol;

    let timeStr = "";
    if (i <= 120) {
      const h = 9 + Math.floor((30 + i) / 60);
      const m = (30 + i) % 60;
      timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } else {
      const offset = i - 120;
      const h = 13 + Math.floor(offset / 60);
      const m = offset % 60;
      timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    minutes.push({
      time: timeStr,
      price: parseFloat(price.toFixed(2)),
      avgPrice: parseFloat((volumeSumPrice / Math.max(1, totalVolume)).toFixed(2)),
      volume: vol
    });
  }
  return minutes;
};

const generateFallbackData = (count: number): KLine[] => {
  const data: KLine[] = [];
  let currentPrice = 30 + Math.random() * 50;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - count * 1.5);

  for (let i = 0; i < count; i++) {
    const change = currentPrice * (Math.random() - 0.485) * 0.04;
    const open = currentPrice;
    const close = open + change;
    const date = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
    
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      data.push({
        date: date.toISOString().split('T')[0],
        open, close,
        high: Math.max(open, close) * (1 + Math.random() * 0.015),
        low: Math.min(open, close) * (1 - Math.random() * 0.015),
        volume: 2000000 + Math.random() * 8000000
      });
      currentPrice = close;
    }
  }

  return data.map((d, i, arr) => {
    const calculateMA = (period: number) => {
      if (i < period - 1) return undefined;
      const sum = arr.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.close, 0);
      return parseFloat((sum / period).toFixed(2));
    };
    return { ...d, ma5: calculateMA(5), ma10: calculateMA(10), ma20: calculateMA(20), ma60: calculateMA(60) };
  });
};
