// playerInput.js
const app = getApp()
const { badmintonSchedule } = require('../../utils/scheduler.js')

Page({
  data: {
    playerCount: 8,
    roundCount: 9,
    courtCount: 3,
    canGoSignup: true
  },
  onLoad: function () {
    // 恢复球员名单
    const savedPlayers = wx.getStorageSync('match_players')
    if (savedPlayers && savedPlayers.length) {
      app.globalData.players = savedPlayers
    }

    // 恢复赛程
    const savedSchedule = wx.getStorageSync('match_schedule')
    if (savedSchedule && savedSchedule.length) {
      this.setData({ schedule: savedSchedule })
      app.globalData.schedule = savedSchedule
    }

    // 恢复排名
    const savedRanking = wx.getStorageSync('match_ranking')
    if (savedRanking && savedRanking.length) {
      this.setData({ ranking: savedRanking })
      app.globalData.ranking = savedRanking
    }
  },
  onShow() {
    const players = app.globalData.players || []
    this.setData({ canCreate: players.length >= 4 })
  },
  inputPlayerCount(e) {
    const count = Number(e.detail.value)
    this.setData({ playerCount: count }, this.checkCanGoSignup)
  },
  inputRoundCount(e) {
    this.setData({ roundCount: Number(e.detail.value) })
  },
  inputCourtCount(e) {
    this.setData({ courtCount: Number(e.detail.value) })
  },
  checkCanGoSignup() {
    this.setData({ canGoSignup: this.data.playerCount >= 4 })
  },
  gotoSignup() {
    app.globalData.playerCount = this.data.playerCount
    app.globalData.roundCount = this.data.roundCount
    app.globalData.courtCount = this.data.courtCount
    wx.navigateTo({ url: '../signup/signup' })
  },
  generateMatches() {
    const players = app.globalData.players || []
    const { roundCount } = this.data
    if (players.length < 4) {
      wx.showToast({ title: '请先报名4名及以上球员', icon: 'none' })
      return
    }
    const schedule = badmintonSchedule(players, 3, 4, 6, roundCount)
    app.globalData.schedule = schedule
    wx.navigateTo({
      url: '../matchTable/matchTable',
    })
  },
  onUnload() {
    // 保存球员名单
    wx.setStorageSync('match_players', app.globalData.players || [])

    // 保存赛程
    wx.setStorageSync('match_schedule', app.globalData.schedule || [])

    // 保存排名
    wx.setStorageSync('match_ranking', this.data.ranking || [])
  }
})
