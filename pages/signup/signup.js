const app = getApp()
const { badmintonSchedule } = require('../../utils/scheduler.js')

Page({
  data: {
    playerCount: 0,
    players: [],
    canSignup: false,
    created: false
  },
  onLoad() {
    const playerCount = app.globalData.playerCount || 8
    // 优先从本地恢复球员名单
    const savedPlayers = wx.getStorageSync('match_players')
    const players = savedPlayers && savedPlayers.length === playerCount
      ? savedPlayers
      : Array.from({ length: playerCount }, () => '')
    this.setData({ playerCount, players })
  },
  updatePlayerName(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const value = e.detail.value
    const players = this.data.players
    players[idx] = value
    this.setData({ players }, () => {
      this.checkCanSignup()
      // 实时保存到本地和全局
      wx.setStorageSync('match_players', players)
      app.globalData.players = players
    })
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

    // 弹窗提示并返回主页
    wx.showToast({
      title: '创建成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)
      }
    })
  },
  onCreateMatch: function () {
    // 创建比赛逻辑
    // ...你的创建比赛代码...

    // 设置创建成功状态
    this.setData({ created: true });

    // 弹窗提示并返回主页
    wx.showToast({
      title: '创建成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)
      }
    })
  },
  signupPlayer(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const players = this.data.players
    const name = players[idx]
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入球员姓名', icon: 'none' })
      return
    }
    // 标记该球员已报名（可扩展为对象，现直接保存字符串）
    players[idx] = name.trim()
    this.setData({ players }, () => {
      this.checkCanSignup()
      wx.setStorageSync('match_players', players)
      app.globalData.players = players
      wx.showToast({ title: '报名成功', icon: 'success', duration: 800 })
    })
  },
})