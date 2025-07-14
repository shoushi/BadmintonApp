/**
 * 验证助手工具类
 */
class ValidationHelper {
  /**
   * 验证球员姓名
   * @param {string} name 球员姓名
   * @returns {Object} 验证结果
   */
  static validatePlayerName(name) {
    if (!name || !name.trim()) {
      return {
        valid: false,
        message: '请输入球员姓名'
      }
    }
    
    return {
      valid: true,
      message: ''
    }
  }

  /**
   * 验证球员性别
   * @param {string} gender 球员性别
   * @returns {Object} 验证结果
   */
  static validatePlayerGender(gender) {
    if (!gender) {
      return {
        valid: false,
        message: '请选择性别'
      }
    }
    
    return {
      valid: true,
      message: ''
    }
  }

  /**
   * 检查球员姓名是否重复
   * @param {Array} players 球员数组
   * @param {string} name 要检查的姓名
   * @param {number} currentIndex 当前球员索引
   * @returns {Object} 检查结果
   */
  static checkDuplicateName(players, name, currentIndex) {
    const trimmedName = name.trim()
    const existingPlayer = players.find((p, index) => 
      p && p.name && p.name.trim() === trimmedName && index !== currentIndex && p.signed
    )
    
    if (existingPlayer) {
      return {
        valid: false,
        message: '球员姓名重复'
      }
    }
    
    return {
      valid: true,
      message: ''
    }
  }

  /**
   * 验证最少报名人数
   * @param {number} signedCount 已报名人数
   * @param {number} minRequired 最少需要人数
   * @returns {Object} 验证结果
   */
  static validateMinSignups(signedCount, minRequired) {
    if (signedCount < minRequired) {
      return {
        valid: false,
        message: `至少需要${minRequired}名球员报名`
      }
    }
    
    return {
      valid: true,
      message: ''
    }
  }
}

module.exports = ValidationHelper
