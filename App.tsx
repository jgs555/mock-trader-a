
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  KLine, StockInfo, UserAccount, TradeRecord 
} from './types';
import { 
  fetchRandomStock, fetchHistoricalDataFromAPI, generateMinuteData 
} from './services/stockService';
import { 
  INITIAL_CASH, COMMISSION_RATE, STAMP_DUTY_RATE, MIN_COMMISSION 
} from './constants';
import KLineChart from './components/KLineChart';
import MinuteChart from './components/MinuteChart';
import TradePanel from './components/TradePanel';
import StatsBoard from './components/StatsBoard';

const App: React.FC = () => {
  const [stock, setStock] = useState<StockInfo | null>(null);
  const [historicalData, setHistoricalData] = useState<KLine[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [intradayStep, setIntradayStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  const [account, setAccount] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('trader_sim_account_v6');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      totalAssets: INITIAL_CASH, availableCash: INITIAL_CASH,
      initialCash: INITIAL_CASH, positions: [], history: []
    };
  });

  const accountRef = useRef(account);
  useEffect(() => { accountRef.current = account; }, [account]);

  const currentKLine = useMemo(() => {
    if (historicalData.length === 0 || visibleCount <= 0) return null;
    return historicalData[Math.min(visibleCount, historicalData.length) - 1];
  }, [historicalData, visibleCount]);

  const prevKLine = useMemo(() => {
    if (historicalData.length === 0 || visibleCount <= 1) return null;
    return historicalData[Math.min(visibleCount, historicalData.length) - 2];
  }, [historicalData, visibleCount]);

  const fullIntradayData = useMemo(() => currentKLine ? generateMinuteData(currentKLine) : [], [currentKLine]);
  const visibleIntradayData = useMemo(() => fullIntradayData.slice(0, intradayStep + 1), [fullIntradayData, intradayStep]);
  const currentMinutePrice = useMemo(() => visibleIntradayData.length > 0 ? visibleIntradayData[visibleIntradayData.length - 1].price : (currentKLine?.open || 0), [visibleIntradayData, currentKLine]);

  // 统一卖出逻辑
  const handleSell = useCallback((amount: number, forcePrice?: number) => {
    if (!stock || !currentKLine) return;
    const currentAcc = accountRef.current;
    const pos = currentAcc.positions.find(p => p.stockCode === stock.code);
    if (!pos || pos.amount < amount) return;

    const price = forcePrice || currentMinutePrice;
    const proceeds = amount * price;
    const fee = Math.max(proceeds * COMMISSION_RATE, MIN_COMMISSION) + proceeds * STAMP_DUTY_RATE;
    const profit = (price - pos.costPrice) * amount - fee;
    const profitRate = (profit / (pos.costPrice * amount)) * 100;

    const newRecord: TradeRecord = {
      id: `sell-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'SELL', stockCode: stock.code, stockName: stock.name,
      price, amount, fee, 
      time: `${currentKLine.date} ${visibleIntradayData[visibleIntradayData.length-1]?.time || '15:00'}`,
      totalAmount: proceeds - fee, profit, profitRate
    };

    setAccount(prev => ({
      ...prev, 
      availableCash: prev.availableCash + proceeds - fee,
      positions: prev.positions.map(p => p.stockCode === stock.code ? { ...p, amount: p.amount - amount } : p).filter(p => p.amount > 0),
      history: [...prev.history, newRecord]
    }));
  }, [stock, currentKLine, currentMinutePrice, visibleIntradayData]);

  // 强制结算当前持仓
  const liquidateCurrentStock = useCallback(() => {
    const currentAcc = accountRef.current;
    if (!stock) return;
    const pos = currentAcc.positions.find(p => p.stockCode === stock.code);
    if (pos && pos.amount > 0) {
      handleSell(pos.amount);
    }
  }, [stock, handleSell]);

  const loadNewStock = useCallback(async (isSkip = false) => {
    if (isSkip) liquidateCurrentStock(); 
    
    setIsLoading(true);
    try {
      const randomStock = fetchRandomStock();
      const result = await fetchHistoricalDataFromAPI(randomStock.code);
      
      setStock(randomStock);
      setHistoricalData(result.data);
      setVisibleCount(result.startIndex + 50); 
      setIntradayStep(0);
      setIsSimulating(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Loader Error:', err);
      setIsLoading(false);
    }
  }, [liquidateCurrentStock]);

  const handleNextDay = useCallback(() => {
    if (visibleCount < historicalData.length) {
      setVisibleCount(prev => prev + 1);
      setIntradayStep(0);
      setIsSimulating(true);
      setAccount(prev => ({ 
        ...prev, 
        positions: prev.positions.map(p => ({ ...p, canSellToday: true })) 
      }));
    } else {
      liquidateCurrentStock(); 
      alert('行情已到达数据终点，系统已自动结算持仓并为您切换下一标的。');
      loadNewStock();
    }
  }, [visibleCount, historicalData.length, loadNewStock, liquidateCurrentStock]);

  useEffect(() => { loadNewStock(); }, []);

  // 自动模拟器
  useEffect(() => {
    if (!isSimulating || intradayStep > 240 || isLoading) return;
    if (intradayStep === 240) {
      const timer = setTimeout(() => handleNextDay(), 2500);
      return () => clearTimeout(timer);
    }
    const tick = setInterval(() => setIntradayStep(prev => prev + 1), 80);
    return () => clearInterval(tick);
  }, [isSimulating, intradayStep, handleNextDay, isLoading]);

  useEffect(() => {
    localStorage.setItem('trader_sim_account_v6', JSON.stringify(account));
  }, [account]);

  // 更新账户动态总资产
  useEffect(() => {
    if (!stock || isLoading || !currentMinutePrice) return;
    setAccount(prev => {
      let marketValue = 0;
      const updatedPositions = prev.positions.map(pos => {
        if (pos.stockCode === stock.code) {
          marketValue += pos.amount * currentMinutePrice;
          return { ...pos, currentPrice: currentMinutePrice };
        }
        marketValue += pos.amount * pos.currentPrice;
        return pos;
      });
      return { ...prev, totalAssets: prev.availableCash + marketValue, positions: updatedPositions };
    });
  }, [currentMinutePrice, stock, isLoading]);

  const handleBuy = (amount: number) => {
    if (!stock || !currentKLine) return;
    const price = currentMinutePrice;
    const cost = amount * price;
    const fee = Math.max(cost * COMMISSION_RATE, MIN_COMMISSION);
    if (account.availableCash < cost + fee) { alert('资金不足'); return; }

    const newRecord: TradeRecord = {
      id: `buy-${Date.now()}`, type: 'BUY', stockCode: stock.code, stockName: stock.name,
      price, amount, fee, time: `${currentKLine.date} ${visibleIntradayData[visibleIntradayData.length-1]?.time || '09:30'}`,
      totalAmount: cost + fee
    };

    setAccount(prev => {
      const existing = prev.positions.find(p => p.stockCode === stock.code);
      let newPositions = existing 
        ? prev.positions.map(p => p.stockCode === stock.code ? { ...p, amount: p.amount + amount, costPrice: (p.costPrice * p.amount + cost) / (p.amount + amount), canSellToday: false } : p)
        : [...prev.positions, { stockCode: stock.code, stockName: stock.name, amount, costPrice: price, currentPrice: price, buyDate: currentKLine.date, canSellToday: false }];
      return { ...prev, availableCash: prev.availableCash - cost - fee, positions: newPositions, history: [...prev.history, newRecord] };
    });
  };

  if (isLoading || !stock || !currentKLine || visibleCount === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-blue-400 font-mono space-y-4 px-10 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm tracking-widest animate-pulse font-bold uppercase">Connecting to Stock Market Timeline...</div>
        <div className="text-[10px] text-slate-500 max-w-xs">如果加载失败，系统将自动切换至本地行情生成器</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 pb-40 lg:pb-10 transition-colors">
      <div className="max-w-[1400px] mx-auto p-3 md:p-6 space-y-4">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500 rounded-xl shadow-lg shadow-red-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight flex items-center gap-2">盘感 Pro <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded">实战模拟器</span></h1>
              <p className="text-[10px] text-slate-500 font-mono">交易标的: {stock.name} ({stock.code}) · 当前进度 {visibleCount} / {historicalData.length} 日</p>
            </div>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between border-t border-slate-700/50 pt-3 md:pt-0 md:border-0">
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">历史日期</p>
              <p className="font-mono text-base font-black text-blue-400">{currentKLine?.date}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">账户资产</p>
              <p className="font-mono text-base font-black text-emerald-400">¥{account.totalAssets.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/30 p-4 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 真实日K复盘
                </h3>
                <div className="flex gap-2 text-[9px] font-mono text-slate-600">
                  <span className="text-yellow-500">MA5:{currentKLine?.ma5?.toFixed(2) || '--'}</span>
                  <span className="text-blue-500">MA10:{currentKLine?.ma10?.toFixed(2) || '--'}</span>
                  <span className="text-purple-500">MA20:{currentKLine?.ma20?.toFixed(2) || '--'}</span>
                </div>
              </div>
              <KLineChart data={historicalData} visibleCount={visibleCount} />
            </div>

            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/30 p-4 shadow-inner relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> 分时图
                </h3>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{visibleIntradayData[visibleIntradayData.length-1]?.time || '09:30'}</span>
                   <button onClick={() => setIsSimulating(!isSimulating)} className="p-1.5 bg-slate-700 rounded-lg text-xs leading-none hover:bg-slate-600 transition-all active:scale-95">
                     {isSimulating ? '⏸' : '▶'}
                   </button>
                </div>
              </div>
              <MinuteChart data={visibleIntradayData} basePrice={prevKLine ? prevKLine.close : (currentKLine?.open || 0)} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <TradePanel 
              stock={stock} 
              currentKLine={currentKLine ? {...currentKLine, close: currentMinutePrice} : { ...historicalData[0], close: 0 }} 
              account={account}
              onBuy={handleBuy}
              onSell={handleSell}
              onSkip={() => loadNewStock(true)}
              onNext={handleNextDay}
            />
            <StatsBoard account={account} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
