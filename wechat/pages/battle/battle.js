const app = getApp();

Page({
  data: {
    roomId: '...',
    status: '正在连接服务器...'
  },

  onLoad() {
    // 1. 注册消息回调
    app.globalData.messageCallback = this.onSocketMessage.bind(this);

    // 2. 检查连接状态并发送创建房间请求
    this.checkConnectionAndCreate();
  },

  checkConnectionAndCreate() {
    // 如果 socket 还没准备好，轮询等待一下（简单实现）
    if (!app.globalData.socketConnected) {
      setTimeout(() => {
        this.checkConnectionAndCreate();
      }, 500);
      return;
    }

    this.setData({ status: '正在创建房间...' });
    app.sendSocketMessage({ type: 'CREATE_ROOM' });
  },

  onSocketMessage(msg) {
    if (msg.type === 'ROOM_CREATED') {
      this.setData({
        roomId: msg.payload.roomId,
        status: '等待对手加入...'
      });
    }
  },

  onUnload() {
    // 页面卸载时清空回调，避免内存泄漏或逻辑错误
    app.globalData.messageCallback = null;
  }
})