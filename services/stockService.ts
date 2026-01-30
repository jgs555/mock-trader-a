
import { KLine, MinuteData, StockInfo } from '../types';
import { SEED_STOCKS } from '../constants';

const PROXY_URL = 'https://api.allorigins.win/raw?url=';

export const fetchRandomStock = (): StockInfo => {
  return SEED_STOCKS[Math.floor(Math.random() * SEED_STOCKS.length)];
};

/**
 * 获取完整历史数据，带有鲁棒的错误处理和缓存穿透
 */
export const fetchHistoricalDataFromAPI = async (code: string): Promise<{ data: KLine[], startIndex: number }> => {
  try {
    const symbol = code.toLowerCase();
    // 增加随机数后缀 _ 防止 API 缓存
    const apiUrl = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,1200,qfq&_=${Date.now()}`;
    
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(apiUrl)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) throw new Error('Proxy returned HTML');

    const parsedData = JSON.parse(rawText);
    const stockData = parsedData.data?.[symbol];
    if (!stockData) throw new Error('Invalid Data Structure');
    
    const rawKData = stockData.qfqday || stockData.day;
    if (!Array.isArray(rawKData) || rawKData.length < 50) throw new Error('Insufficient Data');

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

    // 随机选择起点，留出足够长的交易序列（至少150天）
    const maxStart = Math.max(0, allData.length - 150);
    const startIndex = Math.floor(Math.random() * Math.min(maxStart, 800));

    return { data: allData, startIndex };
  } catch (error) {
    console.warn('Stock API Fetch Error, Switching to Fallback Engine:', error);
    // 生成一个带有随机波动的回退数据集
    const fallbackCount = 800;
    const fallback = generateFallbackData(fallbackCount);
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
  let currentPrice = 50 + Math.random() * 50;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - count * 1.5);

  for (let i = 0; i < count; i++) {
    const dailyReturn = (Math.random() - 0.49) * 0.05; // 模拟略微向上的波动
    const open = currentPrice;
    const close = open * (1 + dailyReturn);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = 5000000 + Math.random() * 20000000;
    
    const date = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      data.push({
        date: date.toISOString().split('T')[0],
        open, close, high, low, volume
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
