// matchTable.js
const app = getApp()
Page({
  data: {
    schedule: [],
    scores: [],
    scoreRange: Array.from({length: 30}, (_, i) => i), // 0~21
    ranking: [], // 新增排名数据
    activeTab: 0,
    genders: {},
    players: [],
    totalMatches: 0,
    completedMatches: 0, // 新增已完成比赛数量
    finishedMatches: [] // 手动完成的比赛列表
  },
  onLoad: function () {
    const app = getApp()
    const schedule = app.globalData.schedule || []
    const players = app.globalData.players || []
    
    // 处理新的数据结构：从 player 对象中提取性别信息
    let playerGenders = {}
    
    if (players.length > 0 && typeof players[0] === 'object' && players[0].name !== undefined) {
      // 新格式：players 是对象数组
      players.forEach(player => {
        if (player && player.name && player.name.trim()) {
          playerGenders[player.name.trim()] = player.gender || 'male'
        }
      })
    } else {
      // 旧格式兼容：尝试从全局 genders 获取
      const genders = app.globalData.genders || {}
      if (Array.isArray(players) && typeof genders === 'object') {
        // 检查 genders 是否为索引格式
        const hasNumericKeys = Object.keys(genders).some(key => !isNaN(key))
        
        if (hasNumericKeys) {
          // 转换索引格式为姓名格式
          players.forEach((player, index) => {
            if (player && player.trim) {
              playerGenders[player.trim()] = genders[index] || 'male'
            }
          })
        } else {
          // 已经是姓名格式
          playerGenders = genders
        }
      }
    }
    
    // 首先尝试从本地存储加载已保存的数据
    const savedScores = wx.getStorageSync('match_scores');
    const savedGenders = wx.getStorageSync('match_genders_by_name');
    const savedTotalMatches = wx.getStorageSync('match_total_matches');
    const savedFinishedMatches = wx.getStorageSync('match_finished') || [];
    
    // 如果有保存的数据，优先使用保存的数据
    let scores, totalMatches, completedMatches;
    
    if (savedScores && savedScores.length > 0) {
      // 使用保存的比分数据
      scores = savedScores;
      playerGenders = savedGenders || playerGenders;
      totalMatches = savedTotalMatches || schedule.reduce((total, round) => total + round.length, 0);
      completedMatches = savedFinishedMatches.length; // 使用手动完成的数量
      console.log('从本地存储恢复比分数据');
    } else {
      // 初始化新的比分数据
      scores = schedule.map(round => 
        round.map(() => ({ left: 0, right: 0 }))
      );
      totalMatches = schedule.reduce((total, round) => total + round.length, 0);
      completedMatches = 0;
      console.log('初始化新的比分数据');
    }

    this.setData({ 
      schedule, 
      scores, 
      genders: playerGenders,
      players: Array.isArray(players) ? players : [],
      totalMatches,
      completedMatches,
      finishedMatches: savedFinishedMatches,
      scoreRange: Array.from({ length: 31 }, (_, i) => i)
    })
    
    // 保存全局数据
    app.globalData.genders = playerGenders
    app.globalData.scores = scores
    app.globalData.totalMatches = totalMatches
    app.globalData.schedule = schedule
    
    // 保存到本地存储（只在没有保存数据时保存初始数据）
    if (!savedScores || savedScores.length === 0) {
      wx.setStorageSync('match_genders_by_name', playerGenders)
      wx.setStorageSync('match_scores', scores)
      wx.setStorageSync('match_schedule', schedule)
      wx.setStorageSync('match_total_matches', totalMatches)
    }
    
    // 初始化时更新比赛进度
    this.updateMatchProgress()
    
    // 初始化进度计算
    this.calculateProgress();
    
    // 调试：检查数据状态
    this.debugDataStatus();
  },
  onShow() {
    // 页面显示时重新加载数据，确保数据同步
    const savedScores = wx.getStorageSync('match_scores');
    const savedGenders = wx.getStorageSync('match_genders_by_name');
    const savedTotalMatches = wx.getStorageSync('match_total_matches');
    const savedSchedule = wx.getStorageSync('match_schedule');
    const savedFinishedMatches = wx.getStorageSync('match_finished') || [];
    
    if (savedScores && savedScores.length > 0) {
      const app = getApp();
      
      // 恢复全局数据
      app.globalData.scores = savedScores;
      app.globalData.genders = savedGenders || this.data.genders;
      app.globalData.schedule = savedSchedule || this.data.schedule;
      app.globalData.totalMatches = savedTotalMatches || this.data.totalMatches;
      
      // 计算已完成比赛数（使用手动完成的记录）
      const completedMatches = savedFinishedMatches.length;
      
      // 更新页面数据
      this.setData({
        scores: savedScores,
        schedule: savedSchedule || this.data.schedule,
        genders: savedGenders || this.data.genders,
        totalMatches: savedTotalMatches || this.data.totalMatches,
        completedMatches,
        finishedMatches: savedFinishedMatches
      });
      
      console.log('页面显示时恢复比分数据:', savedScores);
    }
    
    // 更新比赛进度
    this.updateMatchProgress();
    
    // 重新计算进度
    this.calculateProgress();
  },
  pickerScore(e) {
    const { round, court, side } = e.currentTarget.dataset
    
    // 检查比赛是否已完成，如果已完成则禁止修改
    if (this.isMatchFinished(round, court)) {
      wx.showToast({
        title: '比赛已完成，无法修改比分',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const value = Number(e.detail.value)
    const scores = this.data.scores
    // 防御性初始化
    if (!scores[round]) scores[round] = []
    if (!scores[round][court]) scores[round][court] = { left: 0, right: 0 }
    const scoreRange = this.data.scoreRange
    scores[round][court][side] = scoreRange[value]
    this.setData({ scores }, () => {
      // 同时保存到本地存储和全局数据
      wx.setStorageSync('match_scores', this.data.scores)
      const app = getApp();
      app.globalData.scores = this.data.scores;
      
      this.updateRanking()
      this.updateMatchProgress() // 更新比赛进度
    })
  },
  addScore(e) {
    const { round, court, side } = e.currentTarget.dataset
    
    // 检查比赛是否已完成
    if (this.isMatchFinished(round, court)) {
      wx.showToast({
        title: '比赛已完成，无法修改比分',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const scores = this.data.scores
    // 防御性初始化
    if (!scores[round]) scores[round] = []
    if (!scores[round][court]) scores[round][court] = { left: 0, right: 0 }
    scores[round][court][side] = (scores[round][court][side] || 0) + 1
    this.setData({ scores }, () => {
      // 同时保存到本地存储和全局数据
      wx.setStorageSync('match_scores', this.data.scores)
      const app = getApp();
      app.globalData.scores = this.data.scores;
      
      this.updateRanking()
      this.updateMatchProgress() // 更新比赛进度
    })
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
    const app = getApp();
    
    // 清空本地存储和全局数据
    wx.removeStorageSync('match_scores')
    app.globalData.scores = [];
    
    // 重置页面比分数据
    const schedule = this.data.schedule;
    const resetScores = schedule.map(round => 
      round.map(() => ({ left: 0, right: 0 }))
    );
    
    this.setData({ 
      scores: resetScores,
      completedMatches: 0
    }, () => {
      this.updateRanking()
      this.updateMatchProgress()
    })
  },
  // UI辅助函数
  getPlayerGenderClass(playerName) {
    return this.data.genders[playerName] === 'female' ? 'female' : 'male'
  },

  getPlayerIcon(playerName) {
    return this.data.genders[playerName] === 'female' ? '👩' : '👨'
  },

  getMatchStatus(roundIndex, courtIndex) {
    const score = this.data.scores[roundIndex] && this.data.scores[roundIndex][courtIndex]
    if (!score) return 'waiting'
    
    if (score.left === 0 && score.right === 0) return 'waiting'
    if (this.isMatchFinished(roundIndex, courtIndex)) return 'finished'
    return 'playing'
  },

  getMatchStatusText(roundIndex, courtIndex) {
    const status = this.getMatchStatus(roundIndex, courtIndex)
    switch (status) {
      case 'waiting': return '等待开始'
      case 'playing': return '进行中'
      case 'finished': return '✅ 已结束'
      default: return '等待开始'
    }
  },

  isMatchFinished(roundIndex, courtIndex) {
    // 只检查是否手动完成，不根据比分自动判断
    const matchKey = `${roundIndex}-${courtIndex}`;
    return this.data.finishedMatches.includes(matchKey);
  },

  getWinnerText(roundIndex, courtIndex) {
    const score = this.data.scores[roundIndex] && this.data.scores[roundIndex][courtIndex]
    if (!score || !this.isMatchFinished(roundIndex, courtIndex)) return ''
    
    const match = this.data.schedule[roundIndex][courtIndex]
    if (score.left > score.right) {
      return `A队 (${match[0]}, ${match[1]}) 获胜`
    } else {
      return `B队 (${match[2]}, ${match[3]}) 获胜`
    }
  },

  // 获取比分显示样式类
  getScoreDisplayClass(roundIndex, courtIndex, side) {
    if (!this.isMatchFinished(roundIndex, courtIndex)) return '';
    
    const score = this.data.scores[roundIndex] && this.data.scores[roundIndex][courtIndex];
    if (!score) return '';
    
    const isWinner = (side === 'left' && score.left > score.right) || 
                     (side === 'right' && score.right > score.left);
    
    return isWinner ? 'winning' : 'losing';
  },

  // 完成比赛
  finishMatch(e) {
    const { round, court } = e.currentTarget.dataset;
    const roundIndex = parseInt(round);
    const courtIndex = parseInt(court);
    const matchKey = `${roundIndex}-${courtIndex}`;
    
    // 检查是否已经完成
    if (this.data.finishedMatches.includes(matchKey)) {
      wx.showToast({
        title: '比赛已完成',
        icon: 'none'
      });
      return;
    }

    // 获取比赛信息用于确认弹框
    const match = this.data.schedule[round][court];
    const score = this.data.scores[round] && this.data.scores[round][court];
    const teamA = `${match[0]}, ${match[1]}`;
    const teamB = `${match[2]}, ${match[3]}`;
    const scoreText = score ? `${score.left}:${score.right}` : '0:0';
    
    // 显示确认弹框
    wx.showModal({
      title: '确认完成比赛',
      content: `${teamA}\nvs\n${teamB}\n\n当前比分：${scoreText}\n\n确定要完成这场比赛吗？`,
      confirmText: '完成',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户确认后执行完成操作
          this.executeFinishMatch(roundIndex, courtIndex, matchKey, round, court);
        }
      }
    });
  },

  // 执行完成比赛的具体操作
  executeFinishMatch(roundIndex, courtIndex, matchKey, round, court) {
    // 添加到已完成的比赛列表
    const finishedMatches = [...this.data.finishedMatches];
    finishedMatches.push(matchKey);

    this.setData({
      finishedMatches: finishedMatches
    });

    // 保存到全局数据
    const app = getApp();
    app.globalData.finishedMatches = finishedMatches;

    // 保存到本地存储
    wx.setStorageSync('finishedMatches', finishedMatches);

    // 重新计算进度
    this.calculateProgress();

    // 显示获胜者信息（如果有比分的话）
    const score = this.data.scores[round] && this.data.scores[round][court];
    if (score && score.left !== score.right) {
      const match = this.data.schedule[round][court];
      const winner = score.left > score.right ? 
        `A队 (${match[0]}, ${match[1]})` : 
        `B队 (${match[2]}, ${match[3]})`;

      wx.showToast({
        title: `${winner} 获胜！`,
        icon: 'success',
        duration: 2000
      });
    } else {
      wx.showToast({
        title: '比赛已完成',
        icon: 'success'
      });
    }
  },

  // 获取比赛时长（占位函数，可以后续扩展）
  getMatchDuration(roundIndex, courtIndex) {
    // 这里可以实现比赛时长记录功能
    return '';
  },

  // 清空所有比赛数据
  onClearAllMatches() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有比赛数据吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          this.clearAllMatchData();
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 清空所有比赛相关数据
  clearAllMatchData() {
    const app = getApp();
    
    // 清空本地存储的比赛相关数据
    wx.removeStorageSync('match_scores');
    wx.removeStorageSync('match_schedule');
    wx.removeStorageSync('match_genders_by_name');
    wx.removeStorageSync('match_total_matches');
    wx.removeStorageSync('match_progress');
    
    // 清空全局数据
    app.globalData.scores = [];
    app.globalData.genders = {};
    app.globalData.schedule = [];
    app.globalData.totalMatches = 0;
    app.globalData.matchProgress = {
      total: 0,
      completed: 0,
      percentage: 0
    };
    
    // 重置页面数据
    this.setData({
      schedule: [],
      scores: [],
      genders: {},
      totalMatches: 0,
      completedMatches: 0
    });
    
    // 更新比赛进度
    this.updateMatchProgress();
  },

  // 计算已完成比赛数量
  calculateCompletedMatches(schedule, scores) {
    if (!schedule || !scores || !Array.isArray(schedule) || !Array.isArray(scores)) {
      return 0;
    }
    
    let completed = 0;
    schedule.forEach((round, roundIndex) => {
      if (!Array.isArray(round) || !scores[roundIndex]) return;
      
      round.forEach((match, courtIndex) => {
        if (!scores[roundIndex][courtIndex]) return;
        
        const { left, right } = scores[roundIndex][courtIndex];
        // 使用相同的完成判断逻辑
        if ((left >= 21 && left - right >= 2) || 
            (right >= 21 && right - left >= 2) || 
            left >= 30 || right >= 30) {
          completed++;
        }
      });
    });
    return completed;
  },

  // 更新比赛进度统计
  updateMatchProgress() {
    const completedMatches = this.calculateCompletedMatches(this.data.schedule, this.data.scores);
    this.setData({
      completedMatches
    });
    
    // 更新全局数据供主页使用
    const app = getApp();
    app.globalData.matchProgress = {
      total: this.data.totalMatches,
      completed: completedMatches,
      percentage: Math.round(completedMatches / this.data.totalMatches * 100)
    };
    wx.setStorageSync('match_progress', app.globalData.matchProgress);
  },

  // 重新开始比赛
  resetMatch(e) {
    const { round, court } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认重新开始',
      content: '确定要重新开始这场比赛吗？比分将被重置为0:0，比赛状态也会重新开始',
      success: (res) => {
        if (res.confirm) {
          const roundIndex = parseInt(round);
          const courtIndex = parseInt(court);
          const matchKey = `${roundIndex}-${courtIndex}`;
          
          const scores = this.data.scores;
          
          // 防御性初始化
          if (!scores[round]) scores[round] = [];
          scores[round][court] = { left: 0, right: 0 };
          
          // 从已完成列表中移除
          const finishedMatches = this.data.finishedMatches.filter(key => key !== matchKey);
          
          this.setData({ 
            scores,
            finishedMatches
          }, () => {
            // 同时保存到本地存储和全局数据
            wx.setStorageSync('match_scores', this.data.scores);
            wx.setStorageSync('finishedMatches', finishedMatches);
            const app = getApp();
            app.globalData.scores = this.data.scores;
            app.globalData.finishedMatches = finishedMatches;
            
            this.updateRanking();
            this.updateMatchProgress(); // 更新比赛进度
            this.calculateProgress(); // 重新计算进度
          });
          
          wx.showToast({
            title: '比赛已重新开始',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 从本地存储加载比赛数据（用于特定场景的数据恢复）
  loadMatchDataFromStorage() {
    try {
      const savedScores = wx.getStorageSync('match_scores');
      const savedProgress = wx.getStorageSync('match_progress');
      
      if (savedScores && savedScores.length > 0) {
        console.log('检测到保存的比分数据，确保数据一致性');
        
        // 确保全局数据和页面数据一致
        const app = getApp();
        app.globalData.scores = savedScores;
        
        if (savedProgress) {
          app.globalData.matchProgress = savedProgress;
        }
        
        // 如果当前页面的比分数据不匹配，更新页面数据
        if (JSON.stringify(this.data.scores) !== JSON.stringify(savedScores)) {
          const completedMatches = this.calculateCompletedMatches(this.data.schedule, savedScores);
          
          this.setData({
            scores: savedScores,
            completedMatches
          });
          
          console.log('页面比分数据已同步');
        }
      }
    } catch (error) {
      console.error('从本地存储加载比赛数据失败:', error);
    }
  },

  // 检查是否有有效的比赛数据
  hasValidMatchData() {
    const { schedule, scores } = this.data;
    return schedule && schedule.length > 0 && scores && scores.length > 0;
  },

  // 处理数据不完整的情况
  handleIncompleteData() {
    if (!this.hasValidMatchData()) {
      wx.showModal({
        title: '数据缺失',
        content: '没有找到有效的比赛数据，请先完成比赛设置和球员报名',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return false;
    }
    return true;
  },

  // 调试函数：检查数据状态
  debugDataStatus() {
    const savedScores = wx.getStorageSync('match_scores');
    const currentScores = this.data.scores;
    const app = getApp();
    
    console.log('=== 数据状态检查 ===');
    console.log('本地存储比分:', savedScores);
    console.log('页面当前比分:', currentScores);
    console.log('全局数据比分:', app.globalData.scores);
    console.log('已完成比赛数:', this.data.completedMatches);
    console.log('==================');
    
    return {
      savedScores,
      currentScores,
      globalScores: app.globalData.scores,
      completedMatches: this.data.completedMatches
    };
  },

  // 计算比赛进度
  calculateProgress() {
    const schedule = this.data.schedule;
    if (!schedule || schedule.length === 0) {
      this.setData({
        completedMatches: 0,
        totalMatches: 0,
        progressPercentage: 0
      });
      return;
    }

    let totalMatches = 0;
    let completedMatches = 0;

    // 计算总比赛数和已完成比赛数
    schedule.forEach((round, roundIndex) => {
      round.forEach((match, courtIndex) => {
        if (match && match.length >= 4) {
          totalMatches++;
          if (this.isMatchFinished(roundIndex, courtIndex)) {
            completedMatches++;
          }
        }
      });
    });

    const progressPercentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    this.setData({
      completedMatches,
      totalMatches,
      progressPercentage
    });

    // 保存进度到全局数据
    const app = getApp();
    app.globalData.completedMatches = completedMatches;
    app.globalData.totalMatches = totalMatches;
    app.globalData.progressPercentage = progressPercentage;
  },
})
