const app = getApp()
const { badmintonSchedule } = require('../../utils/scheduler.js')

Page({
  data: {
    playerCount: 0,
    players: [],
    signed: [], // 新增：记录每行是否已报名
    canSignup: false,
    created: false
  },
  onLoad() {
    const playerCount = app.globalData.playerCount || 8
    // 优先从本地恢复球员名单
    const savedPlayers = wx.getStorageSync('match_players')
    const savedSigned = wx.getStorageSync('match_signed')
    const players = savedPlayers && savedPlayers.length === playerCount
      ? savedPlayers
      : Array.from({ length: playerCount }, () => '')
    const signed = savedSigned && savedSigned.length === playerCount
      ? savedSigned
      : Array.from({ length: playerCount }, () => false)
    this.setData({ playerCount, players, signed })
  },
  updatePlayerName(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (this.data.signed[idx]) return; // 已报名不可修改
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
    const courtCount = app.globalData.courtCount || 3
    // 自动生成对战信息，不再传 roundCount，由算法自动补齐
    const schedule = badmintonSchedule(validPlayers, courtCount, 4)
    app.globalData.schedule = schedule
    // 禁用所有输入框和报名按钮
    this.setData({
      signed: Array.from({ length: this.data.playerCount }, () => true)
    })
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
    const signed = this.data.signed
    const name = players[idx]
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入球员姓名', icon: 'none' })
      return
    }
    // 判重：除本行外不能有同名
    if (players.some((n, i) => i !== idx && n.trim && n.trim() === name.trim())) {
      wx.showToast({ title: '姓名已被占用', icon: 'none' })
      return
    }
    players[idx] = name.trim()
    signed[idx] = true
    this.setData({ players, signed }, () => {
      this.checkCanSignup()
      wx.setStorageSync('match_players', players)
      wx.setStorageSync('match_signed', signed)
      app.globalData.players = players
      wx.showToast({ title: '报名成功', icon: 'success', duration: 800 })
    })
  },
})