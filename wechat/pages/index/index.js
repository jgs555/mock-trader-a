const app = getApp();

Page({
  data: {
  },

  onStartMatching() {
    // 1. 初始化连接
    app.initSocket();

    // 2. 直接跳转到对战页面，在对战页面处理具体的匹配逻辑
    wx.navigateTo({
      url: '/pages/battle/battle'
    });
  },

  onSingleTraining() {
    wx.navigateTo({
      url: '/pages/training/training'
    });
  }
})