const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const db = require('./db'); // 引入数据库连接池

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 7001;

// 解析 JSON 请求体
app.use(express.json());

// 简单的健康检查接口
app.get('/', (req, res) => {
  res.send('Mock Trader Server is running');
});

// 存储房间信息的内存结构
// key: roomId, value: { players: [ws1, ws2], status: 'waiting'|'playing' }
const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (e) {
      console.error('Invalid JSON:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // TODO: 处理断线重连或清理房间
  });
});

function handleMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'CREATE_ROOM':
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      rooms.set(roomId, { players: [ws], status: 'waiting' });

      ws.send(JSON.stringify({
        type: 'ROOM_CREATED',
        payload: { roomId }
      }));
      console.log(`Room created: ${roomId}`);
      break;
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});