
import { KLine, MinuteData, StockInfo } from '../types';
import { SEED_STOCKS } from '../constants';

/**
 * 跨域代理服务 - 使用 raw 模式绕过 allorigins 的 JSON 包装，解决解析错误
 */
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

export const fetchRandomStock = (): StockInfo => {
  return SEED_STOCKS[Math.floor(Math.random() * SEED_STOCKS.length)];
};

/**
 * 获取真实前复权历史日 K 线数据
 */
export const fetchHistoricalDataFromAPI = async (code: string): Promise<KLine[]> => {
  try {
    const symbol = code.toLowerCase();
    const count = 1200;
    const apiUrl = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,${count},qfq`;
    
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(apiUrl)}`);
    if (!response.ok) throw new Error(`Network status: ${response.status}`);
    
    const rawText = await response.text();
    if (rawText.includes("Oops") || rawText.startsWith("<!DOCTYPE")) {
       throw new Error("Proxy server error (HTML returned)");
    }

    const parsedData = JSON.parse(rawText);
    const stockData = parsedData.data?.[symbol];
    if (!stockData) throw new Error('Stock node missing');
    
    const rawKData = stockData.qfqday || stockData.day;
    if (!Array.isArray(rawKData) || rawKData.length < 300) throw new Error('Insufficient data');

    const allData: KLine[] = rawKData.map((item: any) => ({
      date: item[0],
      open: parseFloat(item[1]),
      close: parseFloat(item[2]),
      high: parseFloat(item[3]),
      low: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }));

    const windowSize = 400;
    const maxStart = allData.length - windowSize;
    const randomStart = Math.floor(Math.random() * Math.max(1, maxStart));
    const sliceData = allData.slice(randomStart, randomStart + windowSize);

    return sliceData.map((d, i) => {
      const calculateMA = (period: number) => {
        if (i < period - 1) return undefined;
        const sum = sliceData.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.close, 0);
        return parseFloat((sum / period).toFixed(2));
      };
      return {
        ...d,
        ma5: calculateMA(5),
        ma10: calculateMA(10),
        ma20: calculateMA(20),
        ma60: calculateMA(60)
      };
    });
  } catch (error) {
    console.error('Fetch error, using historical fallback:', error);
    return generateFallbackData(400);
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

    // 优化：计算每分钟成交量，确保不为0
    const volBase = kline.volume / totalPoints;
    const factor = (i < 20 || i > 220) ? (1.5 + Math.random()) : (0.5 + Math.random());
    let vol = Math.floor(volBase * factor);
    if (kline.volume > 0 && vol === 0) vol = 1; // 兜底：只要当日有成交量，每分钟至少显示1
    
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
  const startYear = 2015 + Math.floor(Math.random() * 8);
  const startDate = new Date(startYear, Math.floor(Math.random() * 12), 1);
  let currentPrice = 50 + Math.random() * 100;
  
  for (let i = 0; i < count; i++) {
    const change = currentPrice * (Math.random() - 0.485) * 0.03;
    const open = currentPrice;
    const close = open + change;
    const date = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      data.push({
        date: date.toISOString().split('T')[0],
        open, close,
        high: Math.max(open, close) * (1 + Math.random() * 0.01),
        low: Math.min(open, close) * (1 - Math.random() * 0.01),
        volume: 1000000 + Math.random() * 5000000
      });
      currentPrice = close;
    }
  }
  
  return data.map((d, i) => {
    const calculateMA = (period: number) => {
      if (i < period - 1) return undefined;
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.close, 0);
      return parseFloat((sum / period).toFixed(2));
    };
    return { ...d, ma5: calculateMA(5), ma10: calculateMA(10), ma20: calculateMA(20), ma60: calculateMA(60) };
  });
};
