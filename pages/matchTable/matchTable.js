// matchTable.js
const app = getApp()
Page({
  data: {
    schedule: [],
    scores: [],
    scoreRange: Array.from({length: 22}, (_, i) => i), // 0~21
    ranking: [], // 新增排名数据
    activeTab: 0
  },
  onLoad: function () {
    const app = getApp()
    const schedule = app.globalData.schedule || []
    console.log('schedule:', schedule)
    // 保证 scores 结构和 schedule 完全一致
    const scores = schedule.map(round =>
      Array.isArray(round)
        ? round.map(() => ({ left: 0, right: 0 }))
        : []
    )
    this.setData({ schedule, scores }, () => { this.updateRanking() })

    const savedScores = wx.getStorageSync('match_scores')
    if (savedScores) {
      this.setData({ scores: savedScores }, () => {
        this.updateRanking()
      })
    }
  },
  pickerScore(e) {
    const { round, court, side } = e.currentTarget.dataset
    const value = Number(e.detail.value)
    const scores = this.data.scores
    // 防御性初始化
    if (!scores[round]) scores[round] = []
    if (!scores[round][court]) scores[round][court] = { left: 0, right: 0 }
    const scoreRange = this.data.scoreRange
    scores[round][court][side] = scoreRange[value]
    this.setData({ scores }, () => {
      wx.setStorageSync('match_scores', this.data.scores)
      this.updateRanking()
    }) // 更新排名
  },
  addScore(e) {
    const { round, court, side } = e.currentTarget.dataset
    const scores = this.data.scores
    // 防御性初始化
    if (!scores[round]) scores[round] = []
    if (!scores[round][court]) scores[round][court] = { left: 0, right: 0 }
    scores[round][court][side] = (scores[round][court][side] || 0) + 1
    this.setData({ scores }, () => {
      wx.setStorageSync('match_scores', this.data.scores)
      this.updateRanking()
    }) // 更新排名
  },
  getPlayerScores() {
    const { schedule, scores } = this.data
    const playerStats = {} // {player: {win: 0, lose: 0, points: 0, smallPoints: 0}}

    if (!Array.isArray(schedule) || !Array.isArray(scores)) return []

    schedule.forEach((round, roundIdx) => {
      if (!Array.isArray(round) || !Array.isArray(scores[roundIdx])) return
      round.forEach((court, courtIdx) => {
        if (!Array.isArray(court) || court.length !== 4 || !scores[roundIdx] || !scores[roundIdx][courtIdx]) return
        const leftScore = scores[roundIdx][courtIdx].left || 0
        const rightScore = scores[roundIdx][courtIdx].right || 0
        const leftPlayers = [court[0], court[1]]
        const rightPlayers = [court[2], court[3]]

        // 计算胜负和小分
        let leftWin = 0, rightWin = 0
        if (leftScore >= 21 && leftScore > rightScore) {
          leftWin = 1
        } else if (rightScore >= 21 && rightScore > leftScore) {
          rightWin = 1
        }

        leftPlayers.forEach(p => {
          if (!playerStats[p]) playerStats[p] = { win: 0, lose: 0, points: 0, smallPoints: 0 }
          playerStats[p].smallPoints += leftScore
          if (leftWin) {
            playerStats[p].win += 1
            playerStats[p].points += 1 // 21分胜记1大分
          } else if (rightWin) {
            playerStats[p].lose += 1
          }
        })
        rightPlayers.forEach(p => {
          if (!playerStats[p]) playerStats[p] = { win: 0, lose: 0, points: 0, smallPoints: 0 }
          playerStats[p].smallPoints += rightScore
          if (rightWin) {
            playerStats[p].win += 1
            playerStats[p].points += 1
          } else if (leftWin) {
            playerStats[p].lose += 1
          }
        })
      })
    })

    // 排序：大分降序，小分降序
    const ranking = Object.entries(playerStats)
      .map(([player, stat]) => ({
        player,
        win: stat.win,
        lose: stat.lose,
        points: stat.points,
        smallPoints: stat.smallPoints
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return b.smallPoints - a.smallPoints
      })

    return ranking
  },
  // 在需要时调用并 setData
  updateRanking() {
    const ranking = this.getPlayerScores()
    this.setData({ ranking })
    const app = getApp()
    app.globalData.ranking = ranking
  },
  switchTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) })
  },
  onSwiperChange(e) {
    this.setData({ activeTab: e.detail.current })
  },
  clearScores() {
    wx.removeStorageSync('match_scores')
    this.setData({ scores: [] }, () => {
      this.updateRanking()
    })
  }
})
