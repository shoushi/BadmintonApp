const app = getApp()
const { badmintonSchedule } = require('../../utils/scheduler.js')

// 引入工具函数
const PlayerManager = require('./utils/playerManager.js')
const ValidationHelper = require('./utils/validationHelper.js')

Page({
  data: {
    playerCount: 0,
    players: [],
    canSignup: false,
    created: false,
    signupLocked: false,
    filledCount: 0,
    signedCount: 0,
    progressPercent: 0,
    minRequired: 4
  },

  onLoad() {
    this.initializePage()
  },

  // 初始化页面
  initializePage() {
    setTimeout(() => {
      this.initializeData()
    }, 100)
  },
  // 初始化数据
  initializeData() {
    const playerCount = app.globalData.playerCount || 8
    const players = PlayerManager.initializePlayers(playerCount)
    const minRequired = Math.ceil(playerCount / 2)
    
    this.setData({ playerCount, players, minRequired }, () => {
      this.refreshPlayerStats()
    })
  },

  // 刷新球员统计
  refreshPlayerStats() {
    this.updateStats()
    this.checkCanSignup()
  },

  // 更新统计信息
  updateStats() {
    const { players } = this.data
    const filledCount = players.filter(player => player && player.name && player.name.trim()).length
    const signedCount = players.filter(player => player && player.signed).length
    const progressPercent = Math.round((signedCount / players.length) * 100)

    this.setData({
      filledCount,
      signedCount,
      progressPercent
    })
  },

  // 更新球员姓名
  updatePlayerName(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const value = e.detail.value
    
    if (this.data.players[idx].signed) return
    
    const players = [...this.data.players]
    players[idx].name = value

    console.log('Updated player name:', players[idx])
    
    this.updatePlayersData(players)
  },

  // 更新性别选择
  onGenderChange(e) {
    const index = Number(e.currentTarget.dataset.index)
    const gender = e.detail.value
    
    if (this.data.players[index].signed) return
    
    const players = [...this.data.players]
    players[index].gender = gender

    console.log('Updated player gender:', players[index])
    
    this.updatePlayersData(players)
  },

  // 更新球员数据的通用方法
  updatePlayersData(players) {
    this.setData({ players }, () => {
      this.refreshPlayerStats()
      this.savePlayersToStorage(players)
    })
  },

  // 保存球员数据到本地存储
  savePlayersToStorage(players) {
    try {
      wx.setStorageSync('match_players', players)
    } catch (e) {
      console.warn('保存球员数据失败:', e)
    }
  },

  signupPlayer(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const player = this.data.players[idx]
    
    if (!player || !player.name || !player.name.trim()) {
      wx.showToast({
        title: '请输入球员姓名',
        icon: 'none'
      })
      return
    }
    
    if (!player.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      })
      return
    }
    
    const playerName = player.name.trim()
    
    // 检查重名
    const existingPlayer = this.data.players.find((p, index) => 
      p && p.name && p.name.trim() === playerName && index !== idx && p.signed
    )
    
    if (existingPlayer) {
      wx.showToast({
        title: '球员姓名重复',
        icon: 'none'
      })
      return
    }
    
    const players = [...this.data.players]
    players[idx].signed = true

    console.log('Player signed:', players[idx]);
    
    this.setData({ players }, () => {
      this.updateStats()
      this.checkCanSignup()
      try {
        wx.setStorageSync('match_players', players)
      } catch (e) {
        console.warn('保存球员数据失败:', e)
      }
    })
    
    wx.showToast({
      title: `${playerName} 报名成功`,
      icon: 'success'
    })
  },

  checkCanSignup() {
    const signedPlayers = this.data.players.filter(player => 
      player && player.signed && player.name && player.name.trim() && player.gender
    )
    
    const canSignup = signedPlayers.length >= this.data.minRequired

    console.log('Signed players:', signedPlayers);
    console.log('Can signup:', canSignup);
    
    this.setData({ canSignup })
  },

  confirmSignup() {
    const signedPlayers = this.data.players.filter(player => 
      player && player.signed && player.name && player.name.trim() && player.gender
    )
    
    if (signedPlayers.length < this.data.minRequired) {
      wx.showToast({
        title: `至少需要${this.data.minRequired}名球员报名`,
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认完成报名',
      content: `已有${signedPlayers.length}名球员完成报名，确定要生成对阵表吗？`,
      success: (res) => {
        if (res.confirm) {
          this.generateMatches()
        }
      }
    })
  },

  generateMatches() {
    wx.showLoading({ title: '生成对阵中...' })
    
    try {
      const signedPlayers = this.data.players.filter(player => 
        player && player.signed && player.name && player.name.trim() && player.gender
      )
      
      const playerNames = signedPlayers.map(player => player.name.trim())
      const playerGenders = {}
      signedPlayers.forEach(player => {
        playerGenders[player.name.trim()] = player.gender
      })
      
      const courtCount = app.globalData.courtCount || 2
      const maxGamesPerPlayer = app.globalData.maxGamesPerPlayer || 6
      const maxRounds = app.globalData.maxRounds || 9
      
      console.log('生成对阵参数:', {
        playerNames,
        playerGenders,
        courtCount,
        maxGamesPerPlayer,
        maxRounds
      })
      
      const schedule = badmintonSchedule(
        playerNames,
        playerGenders,
        courtCount,
        4,
        maxGamesPerPlayer,
        maxRounds
      )
      
      if (schedule && schedule.length > 0) {
        app.globalData.schedule = schedule
        app.globalData.players = playerNames
        app.globalData.genders = playerGenders
        
        this.setData({ 
          signupLocked: true,
          created: true 
        })
        
        wx.hideLoading()
        
        wx.showModal({
          title: '对阵表生成成功',
          content: `共生成${schedule.length}轮比赛，${schedule.reduce((total, round) => total + round.length, 0)}场对战`,
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/matchTable/matchTable'
              })
            }
          }
        })
      } else {
        throw new Error('对阵表生成失败')
      }
    } catch (error) {
      wx.hideLoading()
      console.error('生成对阵失败:', error)
      wx.showModal({
        title: '生成失败',
        content: '对阵表生成失败，请检查球员信息后重试',
        showCancel: false
      })
    }
  }
})
