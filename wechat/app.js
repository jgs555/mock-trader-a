// app.js
App({
  onLaunch: function () {
    console.log('App Launch');
  },
  globalData: {
    userInfo: null,
    socket: null,
    socketConnected: false,
    messageCallback: null // 用于存放当前页面的回调函数
  },

  // 初始化 WebSocket 连接
  initSocket() {
    if (this.globalData.socket) return;

    const socket = wx.connectSocket({
      url: 'ws://localhost:7001', // 确保端口与 server/index.js 一致
    });

    socket.onOpen(() => {
      console.log('✅ Global WebSocket Connected');
      this.globalData.socketConnected = true;
    });

    socket.onClose(() => {
      console.log('❌ Global WebSocket Closed');
      this.globalData.socketConnected = false;
      this.globalData.socket = null;
    });

    socket.onError((err) => {
      console.error('WebSocket Error:', err);
    });

    // 全局消息监听，收到消息后转发给当前注册的回调
    socket.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data);
        console.log('📩 App received:', msg);
        if (this.globalData.messageCallback) {
          this.globalData.messageCallback(msg);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    });

    this.globalData.socket = socket;
  },

  // 发送消息的辅助函数
  sendSocketMessage(msg) {
    if (this.globalData.socket && this.globalData.socketConnected) {
      this.globalData.socket.send({ data: JSON.stringify(msg) });
    } else {
      // 如果没连接，尝试连接后发送（简单处理：先连接，建议在页面中判断状态）
      console.warn('Socket not connected, trying to connect...');
      this.initSocket();
    }
  }
})
