// utils/stock-logic.js

/**
 * 计算移动平均线 (MA)
 * @param {number} dayCount 周期 (e.g. 5, 10, 20)
 * @param {Array} data K线数据数组 [{close: number}, ...]
 * @returns {Array} MA数据数组 (前dayCount-1个为null或'-')
 */
function calculateMA(dayCount, data) {
  var result = [];
  for (var i = 0, len = data.length; i < len; i++) {
    if (i < dayCount - 1) {
      result.push('-');
      continue;
    }
    var sum = 0;
    for (var j = 0; j < dayCount; j++) {
      sum += data[i - j].close;
    }
    result.push((sum / dayCount).toFixed(2));
  }
  return result;
}

module.exports = {
  calculateMA
};