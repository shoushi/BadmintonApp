// app.js
App({
  onLaunch: function () {
    // 小程序启动时执行的逻辑
    console.log('小程序启动了');
  },
  globalData: {
    // 全局数据，可以在不同页面间共享
    players: [],
    matchResults: []
  }
})
