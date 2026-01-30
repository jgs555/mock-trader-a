
import React from 'react';
import { UserAccount, TradingStats } from '../types';

interface StatsBoardProps {
  account: UserAccount;
}

const StatsBoard: React.FC<StatsBoardProps> = ({ account }) => {
  const { totalAssets, initialCash, history } = account;
  const totalProfit = totalAssets - initialCash;
  const totalProfitRate = (totalProfit / initialCash) * 100;

  const stats: TradingStats = React.useMemo(() => {
    const closedTrades = history.filter(h => h.type === 'SELL');
    const winTrades = closedTrades.filter(t => (t.profit || 0) > 0);
    return {
      totalTrades: history.length,
      winRate: closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0,
      profitTrades: winTrades.length,
      lossTrades: closedTrades.length - winTrades.length,
      maxProfit: Math.max(0, ...closedTrades.map(t => t.profit || 0)),
      maxLoss: Math.min(0, ...closedTrades.map(t => t.profit || 0)),
      totalProfit,
      profitFactor: 0
    };
  }, [history, totalProfit]);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded"></span>
          账户表现
        </h3>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest">DASHBOARD</span>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">净资产</div>
          <div className="text-base font-bold font-mono truncate text-white">
            ¥{totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">总盈亏</div>
          <div className={`text-base font-bold font-mono truncate ${totalProfit >= 0 ? 'text-stock-up' : 'text-stock-down'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-[9px] ml-1">({totalProfitRate.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
         <div className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 text-center">
            <div className="text-[9px] text-slate-600">模拟胜率</div>
            <div className="text-sm font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
         </div>
         <div className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 text-center">
            <div className="text-[9px] text-slate-600">累计成交</div>
            <div className="text-sm font-bold text-slate-300">{stats.totalTrades} 次</div>
         </div>
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-700/50">
        <h4 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex justify-between">
          最近动态 <span className="opacity-40">HISTORY</span>
        </h4>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {history.length === 0 && <div className="text-center py-10 text-slate-600 text-xs italic opacity-40">等待第一笔成交指令...</div>}
          {[...history].reverse().map((record) => (
            <div 
              key={record.id} 
              className="flex justify-between items-center p-3 bg-slate-800/80 rounded-lg text-xs hover:bg-slate-700/80 transition-all border-l-4" 
              style={{ borderLeftColor: record.type === 'BUY' ? '#ef4444' : '#22c55e' }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1 rounded-[2px] text-[9px] font-black ${record.type === 'BUY' ? 'bg-stock-up/20 text-stock-up' : 'bg-stock-down/20 text-stock-down'}`}>
                    {record.type === 'BUY' ? '买入' : '卖出'}
                  </span>
                  <span className="font-bold truncate text-slate-100">{record.stockName}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">{record.time}</div>
              </div>
              <div className="text-right ml-4">
                <div className="font-mono font-bold text-slate-200">@{record.price.toFixed(2)}</div>
                {record.profit !== undefined && (
                  <div className={`font-mono text-[10px] mt-0.5 font-black flex flex-col ${record.profit >= 0 ? 'text-stock-up' : 'text-stock-down'}`}>
                    <span>{record.profit >= 0 ? '+' : ''}{record.profit.toFixed(1)}</span>
                    <span className="opacity-80 text-[8px]">({record.profitRate?.toFixed(2)}%)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;
