// index.js
Page({
  data: {
    // 页面的初始数据
  },
  onLoad: function (options) {
    // 页面加载时执行的函数
  },
  navigateToPlayerInput: function () {
    // 跳转到球员输入页面
    wx.navigateTo({
      url: '../playerInput/playerInput',
    })
  },
  navigateToRanking: function () {
    wx.navigateTo({
      url: '../ranking/ranking',
    })
  },
  navigateToMatchTable: function () {
    wx.navigateTo({
      url: '../matchTable/matchTable',
    })
  },
  navigateToSignup() {
    wx.navigateTo({ url: '../signup/signup' })
  }
})
