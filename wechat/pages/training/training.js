Page({
  data: {
    assets: 100000,        // 总资产
    initialAssets: 100000, // 初始资产
    returnRate: '0.00',    // 收益率
    currentPrice: 0,       // 当前价格
    position: 0,           // 持仓状态: 0空仓, 1做多, -1做空
    positionText: '空仓',
    floatingPL: 0,         // 浮动盈亏
    entryPrice: 0,         // 开仓价格
    positionSize: 0,       // 开仓时的资金量

    candles: [],           // K线数据 {open, close, high, low}
    allHistoryData: [],    // 存储接口获取的全部历史数据
    currentIndex: 0,       // 当前模拟到的历史天数索引
    displayCount: 40,      // 屏幕显示的K线数量
    canvasWidth: 0,
    canvasHeight: 0,

    isTouching: false,     // 是否正在触摸查看详情
    touchX: 0              // 触摸点的X坐标
  },

  onLoad() {
    this.initGame();
  },

  // 初始化游戏
  initGame() {
    wx.showLoading({ title: '获取历史数据...' });

    // 随机选择一只股票 (茅台, 五粮液, 招商银行, 平安)
    const stocks = ['sh600519', 'sz000858', 'sh600036', 'sh601318'];
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];

    wx.request({
      url: 'http://localhost:7000/api/stock/kline',
      data: { symbol: randomStock },
      success: (res) => {
        if (res.data.status === 'success') {
          this.processData(res.data.data);
        } else {
          wx.showToast({ title: '数据获取失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 处理 API 返回的数据
  processData(rawData) {
    // 腾讯API格式: ["2023-01-01", "open", "close", "high", "low", "vol"]
    const formattedData = rawData.map(item => ({
      date: item[0],
      open: parseFloat(item[1]),
      close: parseFloat(item[2]),
      high: parseFloat(item[3]),
      low: parseFloat(item[4])
    }));

    // 随机选择一个开始时间点 (保留至少 100 天用于后续训练)
    // 比如总共 600 天，我们在 [50, 500] 之间随机选一个点开始
    const minStart = 50;
    const maxStart = formattedData.length - 100;
    const startIndex = Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;

    // 初始展示的数据 (从 startIndex 往前推 displayCount 天)
    const initialCandles = formattedData.slice(startIndex - this.data.displayCount + 1, startIndex + 1);
    const currentCandle = initialCandles[initialCandles.length - 1];

    this.setData({
      allHistoryData: formattedData,
      currentIndex: startIndex,
      candles: initialCandles,
      currentPrice: currentCandle.close.toFixed(2),
      assets: 100000,
      position: 0,
      positionText: '空仓',
      floatingPL: 0,
      returnRate: '0.00'
    });

    // 初始化 Canvas
    setTimeout(() => {
      this.initCanvas();
    }, 200);
  },

  // 初始化 Canvas
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#klineCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 处理高清屏模糊问题
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.setData({
          canvasWidth: res[0].width,
          canvasHeight: res[0].height
        });

        this.draw();
      });
  },

  // 绘制 K 线图
  draw() {
    if (!this.ctx) return;
    const { candles, displayCount, canvasWidth, canvasHeight, isTouching, touchX } = this.data;
    const ctx = this.ctx;

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#252525';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 计算可视区域的数据
    const startIndex = Math.max(0, candles.length - displayCount);
    const visibleCandles = candles.slice(startIndex);

    if (visibleCandles.length === 0) return;

    // 计算最大最小值以便定 Y 轴比例
    let minPrice = visibleCandles[0].low;
    let maxPrice = visibleCandles[0].high;
    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    // 上下留白 10%
    const range = maxPrice - minPrice;
    minPrice -= range * 0.1;
    maxPrice += range * 0.1;
    const priceRange = maxPrice - minPrice;

    // 绘图参数
    const candleWidth = canvasWidth / displayCount;
    const padding = 2; // K线之间的间距
    const getY = (p) => canvasHeight - ((p - minPrice) / priceRange) * canvasHeight;

    visibleCandles.forEach((candle, i) => {
      const x = i * candleWidth;
      const isUp = candle.close >= candle.open;
      const color = isUp ? '#d81e06' : '#07c160'; // 红涨绿跌

      // 坐标转换 (Canvas Y轴向下，所以要反转)
      const yOpen = getY(candle.open);
      const yClose = getY(candle.close);
      const yHigh = getY(candle.high);
      const yLow = getY(candle.low);

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      // 画影线 (最高点到最低点)
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // 画实体 (Open 到 Close)
      const bodyHeight = Math.abs(yClose - yOpen);
      const h = bodyHeight < 1 ? 1 : bodyHeight; // 最小高度1px
      const y = Math.min(yOpen, yClose);

      ctx.fillRect(x + padding, y, candleWidth - 2 * padding, h);
    });

    // --- 绘制十字光标和详情浮窗 ---
    if (isTouching) {
      // 1. 计算当前触摸的是哪一根 K 线
      let index = Math.floor(touchX / candleWidth);
      if (index < 0) index = 0;
      if (index >= visibleCandles.length) index = visibleCandles.length - 1;

      const targetCandle = visibleCandles[index];
      const centerX = index * candleWidth + candleWidth / 2;
      const centerY = getY(targetCandle.close);

      // 2. 绘制十字线
      ctx.beginPath();
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]); // 虚线
      // 竖线
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvasHeight);
      // 横线
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvasWidth, centerY);
      ctx.stroke();
      ctx.setLineDash([]); // 恢复实线

      // 3. 绘制详情浮窗 (Tooltip)
      const textX = index < displayCount / 2 ? centerX + 10 : centerX - 130; // 智能判断显示在左边还是右边
      const textY = 20;
      const lineHeight = 16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(textX - 5, textY - 15, 130, 100);

      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`日期: ${targetCandle.date}`, textX, textY);

      const getColor = (val, base) => val >= base ? '#d81e06' : '#07c160';

      ctx.fillStyle = getColor(targetCandle.open, targetCandle.close); // 简单用收盘对比
      ctx.fillText(`开盘: ${targetCandle.open}`, textX, textY + lineHeight);

      ctx.fillStyle = getColor(targetCandle.high, targetCandle.open);
      ctx.fillText(`最高: ${targetCandle.high}`, textX, textY + lineHeight * 2);

      ctx.fillStyle = getColor(targetCandle.low, targetCandle.open);
      ctx.fillText(`最低: ${targetCandle.low}`, textX, textY + lineHeight * 3);

      ctx.fillStyle = getColor(targetCandle.close, targetCandle.open);
      ctx.fillText(`收盘: ${targetCandle.close}`, textX, textY + lineHeight * 4);

      // 涨跌幅
      const change = ((targetCandle.close - targetCandle.open) / targetCandle.open * 100).toFixed(2);
      ctx.fillText(`涨跌: ${change}%`, textX, textY + lineHeight * 5);
    }
  },

  // 触摸开始
  onTouchStart(e) {
    this.setData({ isTouching: true, touchX: e.touches[0].x });
    this.draw();
  },
  // 触摸移动
  onTouchMove(e) {
    this.setData({ touchX: e.touches[0].x });
    this.draw();
  },
  // 触摸结束
  onTouchEnd() {
    this.setData({ isTouching: false });
    this.draw();
  },

  // 下一天
  onNextDay() {
    const { candles, allHistoryData, currentIndex, position, entryPrice, positionSize } = this.data;

    // 检查是否还有数据
    if (currentIndex >= allHistoryData.length - 1) {
      wx.showToast({ title: '训练结束，已是最新数据', icon: 'none' });
      return;
    }

    const nextIndex = currentIndex + 1;
    const newCandle = allHistoryData[nextIndex];
    const newPrice = newCandle.close;

    // 计算浮动盈亏
    let floatingPL = 0;
    if (position !== 0) {
      const diff = newPrice - entryPrice;
      // 盈亏 = (价差 / 成本) * 本金 * 方向
      floatingPL = (diff / entryPrice) * positionSize * position;
    }

    this.setData({
      currentIndex: nextIndex,
      candles: [...candles, newCandle],
      currentPrice: newPrice.toFixed(2),
      floatingPL: floatingPL.toFixed(2)
    });

    this.draw();
  },

  // 买入做多 (全仓)
  onBuyLong() {
    this.setData({
      position: 1,
      positionText: '做多',
      entryPrice: this.data.currentPrice,
      positionSize: this.data.assets, // 简单起见，全仓买入
      floatingPL: 0
    });
  },

  // 卖出做空 (全仓)
  onSellShort() {
    this.setData({
      position: -1,
      positionText: '做空',
      entryPrice: this.data.currentPrice,
      positionSize: this.data.assets,
      floatingPL: 0
    });
  },

  // 平仓
  onClosePosition() {
    const { assets, floatingPL, initialAssets } = this.data;
    const newAssets = assets + parseFloat(floatingPL);
    const returnRate = ((newAssets - initialAssets) / initialAssets * 100).toFixed(2);

    this.setData({
      position: 0,
      positionText: '空仓',
      assets: newAssets.toFixed(2),
      returnRate: returnRate,
      floatingPL: 0,
      entryPrice: 0,
      positionSize: 0
    });
  }
})