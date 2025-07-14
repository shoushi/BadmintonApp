// index.js
const app = getApp()

Page({
  data: {
    playerCount: 0,
    courtCount: 0,
    roundCount: 0,
    hasPlayers: false,
    hasSchedule: false,
    totalRounds: 0,
    totalMatches: 0,
    completedMatches: 0,
    progressPercent: 0
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const playerCount = app.globalData.playerCount || 0
    const courtCount = app.globalData.courtCount || 0
    const roundCount = app.globalData.roundCount || 0
    const players = app.globalData.players || []
    const schedule = app.globalData.schedule || []
    
    // 检查是否有球员数据
    const hasPlayers = players.length > 0 && players.some(p => p && p.name && p.name.trim())
    
    // 检查是否有赛程数据
    const hasSchedule = schedule.length > 0
    
    // 读取比赛进度数据
    const matchProgress = wx.getStorageSync('match_progress') || app.globalData.matchProgress || {
      total: 0,
      completed: 0,
      percentage: 0
    };
    
    let totalMatches = 0;
    let completedMatches = 0;
    let progressPercent = 0;
    
    if (hasSchedule) {
      totalMatches = matchProgress.total || schedule.reduce((sum, round) => sum + round.length, 0);
      completedMatches = matchProgress.completed || 0;
      progressPercent = matchProgress.percentage || 0;
    }

    this.setData({
      playerCount,
      courtCount, 
      roundCount,
      hasPlayers,
      hasSchedule,
      totalRounds: schedule.length,
      totalMatches,
      completedMatches,
      progressPercent
    })
  },

  // 导航方法
  navigateToSetup() {
    wx.navigateTo({
      url: '../setup/setup'
    })
  },

  navigateToSignup() {
    if (!this.data.playerCount) {
      wx.showToast({
        title: '请先设置比赛参数',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '../signup/signup'
    })
  },

  navigateToMatchTable() {
    if (!this.data.hasSchedule) {
      wx.showToast({
        title: '请先生成对阵表',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '../matchTable/matchTable'
    })
  },

  navigateToRanking() {
    wx.navigateTo({
      url: '../ranking/ranking'
    })
  },

  // 工具方法
  exportData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  },

  resetMatch() {
    wx.showModal({
      title: '重置确认',
      content: '确定要重置所有比赛数据吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          // 清除所有数据
          app.globalData = {}
          wx.clearStorageSync()
          
          this.setData({
            playerCount: 0,
            courtCount: 0,
            roundCount: 0,
            hasPlayers: false,
            hasSchedule: false,
            totalRounds: 0,
            totalMatches: 0,
            completedMatches: 0,
            progressPercent: 0
          })
          
          wx.showToast({
            title: '重置成功',
            icon: 'success'
          })
        }
      }
    })
  },

  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 设置比赛参数\n2. 完成球员报名\n3. 生成对阵表\n4. 录入比分进行比赛\n5. 查看排名结果',
      showCancel: false
    })
  }
})
