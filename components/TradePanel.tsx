
import React, { useState } from 'react';
import { StockInfo, UserAccount, KLine } from '../types';

interface TradePanelProps {
  stock: StockInfo;
  currentKLine: KLine;
  account: UserAccount;
  onBuy: (amount: number) => void;
  onSell: (amount: number) => void;
  onSkip: () => void;
  onNext: () => void;
}

const TradePanel: React.FC<TradePanelProps> = ({
  stock,
  currentKLine,
  account,
  onBuy,
  onSell,
  onSkip,
  onNext
}) => {
  const [tradeAmount, setTradeAmount] = useState<number>(100);
  const currentPrice = currentKLine.close;
  
  const maxBuy = Math.floor(account.availableCash / (currentPrice * 1.001) / 100) * 100;
  const currentPosition = account.positions.find(p => p.stockCode === stock.code);
  const maxSell = currentPosition ? currentPosition.amount : 0;

  // PC端侧边栏布局
  const desktopLayout = (
    <div className="hidden lg:flex flex-col bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
        <div>
          <h2 className="text-xl font-bold">{stock.name}</h2>
          <span className="text-xs font-mono text-slate-500">{stock.code}</span>
        </div>
        <div className={`text-2xl font-mono font-bold ${currentKLine.close >= currentKLine.open ? 'text-stock-up' : 'text-stock-down'}`}>
          {currentPrice.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
          <div className="text-slate-500 mb-1">可用资金</div>
          <div className="text-sm font-bold font-mono text-emerald-400">¥{account.availableCash.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
          <div className="text-slate-500 mb-1">当前持仓</div>
          <div className="text-sm font-bold font-mono text-blue-400">{maxSell} 股</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest">交易数量</div>
        <div className="flex gap-2">
          <input
            type="number"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(parseInt(e.target.value) || 0)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 font-mono"
            step={100}
          />
          <button onClick={() => setTradeAmount(maxBuy)} className="px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] font-bold">全仓</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onBuy(tradeAmount)}
          disabled={tradeAmount <= 0 || tradeAmount > maxBuy}
          className="bg-stock-up hover:brightness-110 disabled:opacity-30 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95"
        >
          买入 (B)
        </button>
        <button
          onClick={() => onSell(tradeAmount)}
          disabled={tradeAmount <= 0 || tradeAmount > maxSell}
          className="bg-stock-down hover:brightness-110 disabled:opacity-30 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95"
        >
          卖出 (S)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/50">
        <button onClick={onSkip} className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold">换个标的</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-black">下一交易日</button>
      </div>
    </div>
  );

  // 移动端底部吸附布局
  const mobileLayout = (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] px-4 pt-3 pb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-white">{stock.name}</span>
             <span className={`text-base font-mono font-black ${currentKLine.close >= currentKLine.open ? 'text-stock-up' : 'text-stock-down'}`}>
                {currentPrice.toFixed(2)}
             </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">可用: ¥{account.availableCash.toLocaleString(undefined, {maximumFractionDigits:0})} / 持仓: {maxSell}股</span>
        </div>
        <div className="flex gap-2">
           <button onClick={onSkip} className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-bold">换一只</button>
           <button onClick={onNext} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">下一天</button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
           <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-mono focus:outline-none"
              placeholder="数量"
           />
           <button onClick={() => setTradeAmount(maxBuy)} className="absolute right-2 top-2 px-2 py-1.5 bg-slate-700 rounded text-[9px] text-slate-400">MAX</button>
        </div>
        <div className="flex-[1.2] flex gap-2">
           <button
             onClick={() => onBuy(tradeAmount)}
             disabled={tradeAmount <= 0 || tradeAmount > maxBuy}
             className="flex-1 bg-stock-up active:scale-95 text-white font-black py-3.5 rounded-xl shadow-lg shadow-red-500/10 disabled:opacity-20 transition-all"
           >
             买
           </button>
           <button
             onClick={() => onSell(tradeAmount)}
             disabled={tradeAmount <= 0 || tradeAmount > maxSell}
             className="flex-1 bg-stock-down active:scale-95 text-white font-black py-3.5 rounded-xl shadow-lg shadow-green-500/10 disabled:opacity-20 transition-all"
           >
             卖
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopLayout}
      {mobileLayout}
    </>
  );
};

export default TradePanel;
