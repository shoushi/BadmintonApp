/**
 * 球员管理工具类
 */
class PlayerManager {
  /**
   * 初始化球员数据
   * @param {number} playerCount 球员总数
   * @returns {Array} 球员数组
   */
  static initializePlayers(playerCount) {
    const savedPlayers = wx.getStorageSync('match_players')
    
    if (savedPlayers && savedPlayers.length === playerCount) {
      return this.handleSavedPlayers(savedPlayers, playerCount)
    }
    
    return this.createEmptyPlayers(playerCount)
  }

  /**
   * 处理保存的球员数据
   * @param {Array} savedPlayers 保存的球员数据
   * @param {number} playerCount 球员总数
   * @returns {Array} 处理后的球员数组
   */
  static handleSavedPlayers(savedPlayers, playerCount) {
    if (savedPlayers.length > 0 && typeof savedPlayers[0] === 'string') {
      const savedSigned = wx.getStorageSync('match_signed') || []
      return savedPlayers.map((name, index) => ({
        name: name || '',
        gender: '',
        signed: savedSigned[index] || false
      }))
    }
    
    return savedPlayers.length > 0 ? savedPlayers : this.createEmptyPlayers(playerCount)
  }

  /**
   * 创建空的球员数组
   * @param {number} playerCount 球员总数
   * @returns {Array} 空的球员数组
   */
  static createEmptyPlayers(playerCount) {
    return Array.from({ length: playerCount }, () => ({
      name: '',
      gender: '',
      signed: false
    }))
  }

  /**
   * 获取已报名的球员
   * @param {Array} players 球员数组
   * @returns {Array} 已报名的球员
   */
  static getSignedPlayers(players) {
    return players.filter(player => 
      player && player.signed && player.name && player.name.trim() && player.gender
    )
  }

  /**
   * 检查球员是否可以报名
   * @param {Object} player 球员对象
   * @returns {boolean} 是否可以报名
   */
  static canPlayerSignup(player) {
    return player && player.name && player.name.trim() && player.gender && !player.signed
  }
}

module.exports = PlayerManager
