Page({
  data: {
    ranking: []
  },
  onLoad() {
    const app = getApp()
    // 假设 app.globalData.ranking 已在主页面 setData 时同步赋值
    this.setData({
      ranking: app.globalData.ranking || []
    })
  },
  updateRanking() {
    const ranking = this.getPlayerScores()
    this.setData({ ranking })
    const app = getApp()
    app.globalData.ranking = ranking
  }
})