const app = getApp()
const { badmintonSchedule } = require('../../utils/scheduler.js')

Page({
  data: {
    playerCount: 0,
    players: [],
    canSignup: false
  },
  onLoad() {
    const playerCount = app.globalData.playerCount || 8
    const players = Array.from({ length: playerCount }, () => '')
    this.setData({ playerCount, players })
  },
  updatePlayerName(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const value = e.detail.value
    const players = this.data.players
    players[idx] = value
    this.setData({ players }, this.checkCanSignup)
  },
  checkCanSignup() {
    const { players, playerCount } = this.data
    const validPlayers = players.filter(name => name && name.trim())
    this.setData({ canSignup: validPlayers.length === playerCount && playerCount >= 4 })
  },
  confirmSignup() {
    const { players } = this.data
    const validPlayers = players.filter(name => name && name.trim())
    const roundCount = app.globalData.roundCount || 9
    const courtCount = app.globalData.courtCount || 3

    // 记录报名信息
    app.globalData.signupInfo = {
      players: validPlayers,
      playerCount: validPlayers.length,
      signupTime: Date.now()
    }

    // 自动生成对战信息
    const schedule = badmintonSchedule(validPlayers, courtCount, 4, 6, roundCount)
    app.globalData.schedule = schedule
    wx.navigateTo({
      url: '../matchTable/matchTable',
    })
  }
})