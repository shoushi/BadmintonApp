// setup.js
const app = getApp()

Page({
  data: {
    playerCount: 8,
    courtCount: 2,
    roundCount: 4,
    maxGamesPerPlayer: 6,
    estimatedRounds: 0,
    estimatedMatches: 0,
    estimatedTime: 0
  },

  onLoad() {
    this.loadSettings()
    this.calculateEstimates()
  },

  loadSettings() {
    // 从全局数据或缓存中加载设置
    const playerCount = app.globalData.playerCount || wx.getStorageSync('playerCount') || 8
    const courtCount = app.globalData.courtCount || wx.getStorageSync('courtCount') || 2
    const roundCount = app.globalData.roundCount || wx.getStorageSync('roundCount') || 4
    const maxGamesPerPlayer = app.globalData.maxGamesPerPlayer || wx.getStorageSync('maxGamesPerPlayer') || 6

    this.setData({
      playerCount,
      courtCount,
      roundCount,
      maxGamesPerPlayer
    })

    this.calculateEstimates()
  },

  calculateEstimates() {
    const { playerCount, courtCount, roundCount, maxGamesPerPlayer } = this.data
    
    // 简单估算
    const playersPerMatch = 4
    const maxMatchesPerRound = courtCount
    const totalPlayerSlots = playerCount * maxGamesPerPlayer
    const estimatedMatches = Math.ceil(totalPlayerSlots / playersPerMatch)
    const estimatedRounds = Math.min(Math.ceil(estimatedMatches / maxMatchesPerRound), roundCount)
    const estimatedTime = estimatedMatches * 15 // 假设每场比赛15分钟

    this.setData({
      estimatedRounds,
      estimatedMatches,
      estimatedTime
    })
  },

  // 参赛人数控制
  decreasePlayerCount() {
    if (this.data.playerCount > 4) {
      this.setData({
        playerCount: this.data.playerCount - 1
      })
      this.calculateEstimates()
    }
  },

  increasePlayerCount() {
    if (this.data.playerCount < 20) {
      this.setData({
        playerCount: this.data.playerCount + 1
      })
      this.calculateEstimates()
    }
  },

  onPlayerCountInput(e) {
    const value = parseInt(e.detail.value) || 4
    const playerCount = Math.max(4, Math.min(20, value))
    this.setData({ playerCount })
    this.calculateEstimates()
  },

  // 场地数量控制
  decreaseCourtCount() {
    if (this.data.courtCount > 1) {
      this.setData({
        courtCount: this.data.courtCount - 1
      })
      this.calculateEstimates()
    }
  },

  increaseCourtCount() {
    if (this.data.courtCount < 5) {
      this.setData({
        courtCount: this.data.courtCount + 1
      })
      this.calculateEstimates()
    }
  },

  onCourtCountInput(e) {
    const value = parseInt(e.detail.value) || 1
    const courtCount = Math.max(1, Math.min(5, value))
    this.setData({ courtCount })
    this.calculateEstimates()
  },

  // 轮次控制
  decreaseRoundCount() {
    if (this.data.roundCount > 3) {
      this.setData({
        roundCount: this.data.roundCount - 1
      })
      this.calculateEstimates()
    }
  },

  increaseRoundCount() {
    if (this.data.roundCount < 10) {
      this.setData({
        roundCount: this.data.roundCount + 1
      })
      this.calculateEstimates()
    }
  },

  onRoundCountInput(e) {
    const value = parseInt(e.detail.value) || 3
    const roundCount = Math.max(3, Math.min(10, value))
    this.setData({ roundCount })
    this.calculateEstimates()
  },

  // 最大场次控制
  decreaseMaxGames() {
    if (this.data.maxGamesPerPlayer > 3) {
      this.setData({
        maxGamesPerPlayer: this.data.maxGamesPerPlayer - 1
      })
      this.calculateEstimates()
    }
  },

  increaseMaxGames() {
    if (this.data.maxGamesPerPlayer < 10) {
      this.setData({
        maxGamesPerPlayer: this.data.maxGamesPerPlayer + 1
      })
      this.calculateEstimates()
    }
  },

  onMaxGamesInput(e) {
    const value = parseInt(e.detail.value) || 3
    const maxGamesPerPlayer = Math.max(3, Math.min(10, value))
    this.setData({ maxGamesPerPlayer })
    this.calculateEstimates()
  },

  // 保存设置
  saveSettings() {
    const { playerCount, courtCount, roundCount, maxGamesPerPlayer } = this.data

    // 保存到全局数据
    app.globalData.playerCount = playerCount
    app.globalData.courtCount = courtCount
    app.globalData.roundCount = roundCount
    app.globalData.maxGamesPerPlayer = maxGamesPerPlayer

    // 保存到本地存储
    wx.setStorageSync('playerCount', playerCount)
    wx.setStorageSync('courtCount', courtCount)
    wx.setStorageSync('roundCount', roundCount)
    wx.setStorageSync('maxGamesPerPlayer', maxGamesPerPlayer)

    wx.showToast({
      title: '设置保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 重置默认设置
  resetSettings() {
    wx.showModal({
      title: '重置确认',
      content: '确定要重置为默认设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            playerCount: 8,
            courtCount: 2,
            roundCount: 4,
            maxGamesPerPlayer: 6
          })
          this.calculateEstimates()
          
          wx.showToast({
            title: '已重置为默认设置',
            icon: 'success'
          })
        }
      }
    })
  }
})
