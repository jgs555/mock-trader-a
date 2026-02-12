const express = require('express');
const db = require('./db');
const https = require('https'); // 引入 https 模块用于请求外部 API
const app = express();
const PORT = 7000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Mock Trader Server is running');
});

// 测试数据库连接接口
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.json({ status: 'success', solution: rows[0].solution });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取股票 K 线数据的代理接口
app.get('/api/stock/kline', (req, res) => {
  const symbol = req.query.symbol || 'sh600519'; // 默认茅台
  // 腾讯财经接口: 获取日K线，qfq(前复权)，最近 640 天数据
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,640,qfq`;

  https.get(url, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        // 简单处理一下数据结构，直接返回给前端
        if (parsedData.code === 0 && parsedData.data && parsedData.data[symbol]) {
          const klineData = parsedData.data[symbol].day || parsedData.data[symbol].qfqday;
          res.json({ status: 'success', data: klineData });
        } else {
          res.status(404).json({ status: 'error', message: 'Data not found' });
        }
      } catch (e) {
        res.status(500).json({ status: 'error', message: 'Failed to parse external API' });
      }
    });

  }).on('error', (err) => {
    res.status(500).json({ status: 'error', message: err.message });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});