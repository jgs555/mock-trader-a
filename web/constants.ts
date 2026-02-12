
import { StockInfo } from './types';

export const INITIAL_CASH = 1000000;
export const COMMISSION_RATE = 0.0003; 
export const STAMP_DUTY_RATE = 0.001;  
export const MIN_COMMISSION = 5;       

/**
 * 核心训练标的：精选 A 股各行业龙头，确保代码在 API 中有效
 */
export const SEED_STOCKS: StockInfo[] = [
  { code: 'sh600519', name: '贵州茅台' },
  { code: 'sz000858', name: '五粮液' },
  { code: 'sz000001', name: '平安银行' },
  { code: 'sh601318', name: '中国平安' },
  { code: 'sz300750', name: '宁德时代' },
  { code: 'sz002594', name: '比亚迪' },
  { code: 'sh600036', name: '招商银行' },
  { code: 'sh600276', name: '恒瑞医药' },
  { code: 'sz300059', name: '东方财富' },
  { code: 'sh601888', name: '中国中免' },
  { code: 'sz000651', name: '格力电器' },
  { code: 'sh600887', name: '伊利股份' },
  { code: 'sz002415', name: '海康威视' },
  { code: 'sh600030', name: '中信证券' },
  { code: 'sz000333', name: '美的集团' },
  { code: 'sh601012', name: '隆基绿能' },
  { code: 'sh600900', name: '长江电力' },
  { code: 'sh601398', name: '工商银行' },
  { code: 'sh601857', name: '中国石油' },
  { code: 'sz000002', name: '万科A' },
  { code: 'sh601668', name: '中国建筑' },
  { code: 'sz000725', name: '京东方A' },
  { code: 'sh600019', name: '宝钢股份' },
  { code: 'sh601166', name: '兴业银行' },
  { code: 'sh601988', name: '中国银行' },
  { code: 'sz002304', name: '洋河股份' }
];
