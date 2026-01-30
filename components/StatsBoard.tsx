
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
          交易表现统计
        </h3>
        <span className="text-xs text-slate-500 font-mono">LIVE PERFORMANCE</span>
      </div>
      
      <div className="p-4 flex flex-wrap gap-y-6">
        <div className="w-1/2 md:w-1/4 px-2 border-r border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">总资产</div>
          <div className="text-lg sm:text-xl font-bold font-mono truncate">
            ¥{totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="w-1/2 md:w-1/4 px-2 border-r border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">累计盈亏</div>
          <div className={`text-lg sm:text-xl font-bold font-mono truncate ${totalProfit >= 0 ? 'text-stock-up' : 'text-stock-down'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <div className="text-xs font-normal">({totalProfitRate.toFixed(2)}%)</div>
          </div>
        </div>
        <div className="w-1/2 md:w-1/4 px-2 border-r border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">模拟胜率</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-blue-400">
            {stats.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="w-1/2 md:w-1/4 px-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">交易笔数</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-300">
            {stats.totalTrades}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-900/40 border-t border-slate-700/50">
        <h4 className="text-[10px] font-semibold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
          最近动态
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {history.length === 0 && <div className="text-center py-6 text-slate-600 text-xs italic">等待第一笔成交...</div>}
          {[...history].reverse().map((record) => (
            <div key={record.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg text-xs hover:bg-slate-700/50 transition-colors border-l-2" style={{ borderLeftColor: record.type === 'BUY' ? '#ef4444' : '#22c55e' }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1 rounded-[2px] text-[10px] ${record.type === 'BUY' ? 'bg-stock-up/20 text-stock-up' : 'bg-stock-down/20 text-stock-down'}`}>
                    {record.type === 'BUY' ? '买' : '卖'}
                  </span>
                  <span className="font-bold truncate">{record.stockName}</span>
                </div>
                <div className="text-slate-500 mt-1">{record.time} · {record.amount}股</div>
              </div>
              <div className="text-right ml-4">
                <div className="font-mono font-bold">@{record.price.toFixed(2)}</div>
                {record.profit !== undefined && (
                  <div className={`font-mono text-[10px] mt-0.5 ${record.profit >= 0 ? 'text-stock-up' : 'text-stock-down'}`}>
                    {record.profit >= 0 ? '+' : ''}{record.profit.toFixed(1)}
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
