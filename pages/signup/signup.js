const app = getApp()
const { badmintonSchedule } = require('../../utils/scheduler.js')

Page({
  data: {
    playerCount: 0,
    players: [], // 现在存储对象 {name: '', gender: '', signed: false}
    canSignup: false,
    created: false
  },
  onLoad() {
    // 延迟执行，确保小程序完全初始化
    setTimeout(() => {
      this.initializeData();
    }, 100);
  },
  
  initializeData() {
    const playerCount = app.globalData.playerCount || 8
    // 优先从本地恢复球员名单
    const savedPlayers = wx.getStorageSync('match_players')
    
    let players
    if (savedPlayers && savedPlayers.length === playerCount) {
      // 如果是旧格式（字符串数组），转换为新格式
      if (savedPlayers.length > 0 && typeof savedPlayers[0] === 'string') {
        const savedSigned = wx.getStorageSync('match_signed') || []
        // 旧的 genders 数据不再使用，直接初始化为空
        players = savedPlayers.map((name, index) => ({
          name: name || '',
          gender: '', // 重新选择性别
          signed: savedSigned[index] || false
        }))
      } else {
        // 已经是新格式或空数组
        players = savedPlayers.length > 0 ? savedPlayers : Array.from({ length: playerCount }, () => ({
          name: '',
          gender: '',
          signed: false
        }))
      }
    } else {
      // 初始化新格式
      players = Array.from({ length: playerCount }, () => ({
        name: '',
        gender: '',
        signed: false
      }))
    }
    
    this.setData({ playerCount, players })
  },
  updatePlayerName(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (this.data.players[idx].signed) return; // 已报名不可修改
    const value = e.detail.value
    const players = this.data.players
    players[idx].name = value
    this.setData({ players }, () => {
      this.checkCanSignup()
      // 确保小程序完全初始化后再保存
      try {
        wx.setStorageSync('match_players', players)
        app.globalData.players = players
      } catch (e) {
        console.warn('保存数据失败:', e)
      }
    })
  },
  checkCanSignup() {
    const { players, playerCount } = this.data
    const validPlayers = players.filter(player => player && player.name && player.name.trim())
    this.setData({ canSignup: validPlayers.length === playerCount && playerCount >= 4 })
  },
  confirmSignup() {
    const { players } = this.data
    const validPlayers = players.filter(player => player && player.name && player.name.trim())
    
    // 转换为算法需要的格式
    const playerNames = validPlayers.map(player => player.name.trim())
    const playerGenders = {}
    validPlayers.forEach(player => {
      playerGenders[player.name.trim()] = player.gender || 'male'
    })
    
    const courtCount = app.globalData.courtCount || 3
    // 传递转换后的性别数据
    const schedule = badmintonSchedule(playerNames, playerGenders, courtCount, 4)
    app.globalData.schedule = schedule
    app.globalData.genders = playerGenders
    
    // 同时保存到本地存储
    try {
      wx.setStorageSync('match_genders_by_name', playerGenders)
    } catch (e) {
      console.warn('保存性别数据失败:', e)
    }
    
    // 禁用所有输入框和报名按钮
    const updatedPlayers = this.data.players.map(player => ({
      ...player,
      signed: true
    }))
    this.setData({ players: updatedPlayers })
    
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
    const idx = Number(e.currentTarget.dataset.idx);
    const players = this.data.players;
    const player = players[idx];
    
    const playerName = player.name || '';
    if (!playerName || !playerName.trim()) {
      wx.showToast({ title: '请输入球员姓名', icon: 'none' });
      return;
    }
    if (!player.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }
    // 判重：除本行外不能有同名
    if (players.some((p, i) => i !== idx && p && p.name && p.name.trim() === playerName.trim())) {
      wx.showToast({ title: '姓名已被占用', icon: 'none' });
      return;
    }
    
    players[idx].name = playerName.trim();
    players[idx].signed = true;
    
    this.setData({ players }, () => {
      this.checkCanSignup();
      // 确保小程序完全初始化后再保存
      try {
        wx.setStorageSync('match_players', players);
        app.globalData.players = players;
      } catch (e) {
        console.warn('保存数据失败:', e)
      }
      wx.showToast({ title: '报名成功', icon: 'success', duration: 800 });
    });
  },
  onGenderChange(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    const players = this.data.players;
    players[index].gender = value; // 将性别作为球员对象的属性
    this.setData({ players }, () => {
      // 确保小程序完全初始化后再保存
      try {
        wx.setStorageSync('match_players', players); // 保存整个球员对象到本地存储
        app.globalData.players = players; // 同步到全局数据
      } catch (e) {
        console.warn('保存数据失败:', e)
      }
    });
  },
  onSubmit() {
    const { players } = this.data;
    // 验证性别是否已选择
    for (let i = 0; i < players.length; i++) {
      if (players[i] && players[i].name && players[i].name.trim() && !players[i].gender) {
        wx.showToast({
          title: `请为玩家 ${players[i].name} 选择性别`,
          icon: 'none'
        });
        return;
      }
    }
    // ...existing submit logic...
  },
})