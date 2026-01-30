
export interface KLine {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
}

export interface MinuteData {
  time: string;
  price: number;
  avgPrice: number;
  volume: number;
}

export interface StockInfo {
  code: string;
  name: string;
}

export interface Position {
  stockCode: string;
  stockName: string;
  amount: number; // 股数
  costPrice: number;
  currentPrice: number;
  buyDate: string;
  canSellToday: boolean; // T+1 rule
}

export interface TradeRecord {
  id: string;
  type: 'BUY' | 'SELL';
  stockCode: string;
  stockName: string;
  price: number;
  amount: number;
  fee: number;
  time: string;
  totalAmount: number;
  profit?: number;
  profitRate?: number;
}

export interface UserAccount {
  totalAssets: number;
  availableCash: number;
  initialCash: number;
  positions: Position[];
  history: TradeRecord[];
}

export interface TradingStats {
  winRate: number;
  totalTrades: number;
  profitTrades: number;
  lossTrades: number;
  maxProfit: number;
  maxLoss: number;
  totalProfit: number;
  profitFactor: number;
}
