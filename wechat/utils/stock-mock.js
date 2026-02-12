// utils/stock-mock.js

/**
 * 生成随机K线数据
 * @param {number} count K线数量
 * @param {number} basePrice 初始价格
 * @returns {array} K线数据
 */
function generateCandleStickData(count = 100, basePrice = 10) {
  const data = [];
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const change = Math.random() * 2 - 1; // 涨跌幅 -1 ~ 1
    const newPrice = price + change;
    const open = price;
    const close = newPrice;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    const volume = Math.floor(Math.random() * 100000);

    data.push({
      date: `2024-01-${i + 1}`,
      open,
      close,
      high,
      low,
      volume
    });

    price = newPrice;
  }

  return data;
}

/**
 * 生成随机分时图数据
 * @param {number} basePrice  初始价格
 * @returns {array} 分时图数据
 */
function generateMinuteData(basePrice = 10) {
  const data = [];
  let price = basePrice;

  // 定义交易时间段 (小时, 分钟)
  const timeRanges = [
    { startH: 9, startM: 30, endH: 11, endM: 30 },
    { startH: 13, startM: 0, endH: 15, endM: 0 }
  ];

  timeRanges.forEach(range => {
    let h = range.startH;
    let m = range.startM;

    while (h < range.endH || (h === range.endH && m <= range.endM)) {
      const change = Math.random() * 0.2 - 0.1;
      price += change;
      const displayTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const volume = Math.floor(Math.random() * 5000);

      data.push({
        time: displayTime,
        price: parseFloat(price.toFixed(2)),
        avgPrice: parseFloat((price + Math.random() * 0.1 - 0.05).toFixed(2)),
        volume
      });

      m++;
      if (m >= 60) {
        m = 0;
        h++;
      }
    }
  });

  return data;
}

/**
 * 随机获取一只股票的模拟数据
 * @returns {object} 股票数据
 */
function getRandomStockData() {
  const code = String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0');
  const name = `测试股票${code}`;
  const basePrice = Math.random() * 20 + 5; // 5-25
  const klines = generateCandleStickData(120, basePrice);
  const minutes = generateMinuteData(basePrice);

  return {
    code,
    name,
    klines,
    minutes
  };
}


module.exports = {
  generateCandleStickData,
  generateMinuteData,
  getRandomStockData
};