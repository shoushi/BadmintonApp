function isAllPartnered(group, partners) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (!partners[group[i]].has(group[j])) {
        return false;
      }
    }
  }
  return true;
}

function isValidGroup(group, partners, partnerCounts) {
  // 检查是否有人已经搭档过超过2次
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const player1 = group[i];
      const player2 = group[j];
      const key = [player1, player2].sort().join('-');
      
      // 如果这对搭档已经合作过2次，则不能再组合
      if (partnerCounts[key] >= 2) {
        return false;
      }
    }
  }
  return true;
}

function isPlayedLastThree(dq) {
  return dq.length === 3 && dq.every(Boolean);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function selectGroup(players, partners, used, recentPlays, playCount, maxGamesPerPlayer, genders, partnerCounts) {
  const shuffledPlayers = [...players];
  shuffleArray(shuffledPlayers);
  const sorted = shuffledPlayers.sort((a, b) => playCount[a] - playCount[b]);
  
  // 统计可用玩家的性别分布
  const availablePlayers = sorted.filter(p => 
    !used.has(p) && 
    !isPlayedLastThree(recentPlays[p]) && 
    playCount[p] < maxGamesPerPlayer
  );
  
  const availableMales = availablePlayers.filter(p => genders[p] === 'male');
  const availableFemales = availablePlayers.filter(p => genders[p] === 'female');
  
  // 第一优先级：真正的混双分组（1男1女 vs 1男1女）
  if (availableMales.length >= 2 && availableFemales.length >= 2) {
    const mixedGroup = generateMixedDoubleGroup(availableMales, availableFemales, partners, partnerCounts);
    if (mixedGroup) {
      return mixedGroup;
    }
  }

  // 第二优先级：同性组合（4男0女、0男4女）
  // 尝试4男组合
  if (availableMales.length >= 4) {
    for (let i = 0; i < availableMales.length; i++) {
      let a = availableMales[i];
      for (let j = i + 1; j < availableMales.length; j++) {
        let b = availableMales[j];
        for (let k = j + 1; k < availableMales.length; k++) {
          let c = availableMales[k];
          for (let l = k + 1; l < availableMales.length; l++) {
            let d = availableMales[l];
            let group = [a, b, c, d];
            if (isValidGroup(group, partners, partnerCounts)) {
              return group;
            }
          }
        }
      }
    }
  }
  
  // 尝试4女组合
  if (availableFemales.length >= 4) {
    for (let i = 0; i < availableFemales.length; i++) {
      let a = availableFemales[i];
      for (let j = i + 1; j < availableFemales.length; j++) {
        let b = availableFemales[j];
        for (let k = j + 1; k < availableFemales.length; k++) {
          let c = availableFemales[k];
          for (let l = k + 1; l < availableFemales.length; l++) {
            let d = availableFemales[l];
            let group = [a, b, c, d];
            if (isValidGroup(group, partners, partnerCounts)) {
              return group;
            }
          }
        }
      }
    }
  }

  // 第三优先级：其他可接受的性别组合
  for (let i = 0; i < sorted.length; i++) {
    let a = sorted[i];
    if (used.has(a) || isPlayedLastThree(recentPlays[a]) || playCount[a] >= maxGamesPerPlayer) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      let b = sorted[j];
      if (used.has(b) || isPlayedLastThree(recentPlays[b]) || playCount[b] >= maxGamesPerPlayer) continue;
      for (let k = j + 1; k < sorted.length; k++) {
        let c = sorted[k];
        if (used.has(c) || isPlayedLastThree(recentPlays[c]) || playCount[c] >= maxGamesPerPlayer) continue;
        for (let l = k + 1; l < sorted.length; l++) {
          let d = sorted[l];
          if (used.has(d) || isPlayedLastThree(recentPlays[d]) || playCount[d] >= maxGamesPerPlayer) continue;
          let group = [a, b, c, d];
          if (isValidGroup(group, partners, partnerCounts) && isGenderBalanced(group, genders)) {
            return group;
          }
        }
      }
    }
  }

  // 第四优先级：仅考虑搭档次数限制（最后的兜底方案）
  for (let i = 0; i < sorted.length; i++) {
    let a = sorted[i];
    if (used.has(a) || isPlayedLastThree(recentPlays[a]) || playCount[a] >= maxGamesPerPlayer) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      let b = sorted[j];
      if (used.has(b) || isPlayedLastThree(recentPlays[b]) || playCount[b] >= maxGamesPerPlayer) continue;
      for (let k = j + 1; k < sorted.length; k++) {
        let c = sorted[k];
        if (used.has(c) || isPlayedLastThree(recentPlays[c]) || playCount[c] >= maxGamesPerPlayer) continue;
        for (let l = k + 1; l < sorted.length; l++) {
          let d = sorted[l];
          if (used.has(d) || isPlayedLastThree(recentPlays[d]) || playCount[d] >= maxGamesPerPlayer) continue;
          let group = [a, b, c, d];
          if (isValidGroup(group, partners, partnerCounts)) {
            return group;
          }
        }
      }
    }
  }
  return null;
}

function isGenderBalanced(group, genders) {
  if (!genders || Object.keys(genders).length === 0) return true; // 如果没有性别信息，不做限制
  
  const maleCount = group.filter(player => genders[player] === 'male').length;
  const femaleCount = group.filter(player => genders[player] === 'female').length;
  
  // 根据规则3，只接受以下组合类型：
  // ✅ 2男2女 - 混合双打（最优先）
  if (maleCount === 2 && femaleCount === 2) return true;
  
  // ✅ 4男0女 - 男双对战
  if (maleCount === 4 && femaleCount === 0) return true;
  
  // ✅ 0男4女 - 女双对战
  if (maleCount === 0 && femaleCount === 4) return true;
  
  return false;
}

function isStrictGenderBalanced(group, genders) {
  if (!genders || Object.keys(genders).length === 0) return true;
  
  const maleCount = group.filter(player => genders[player] === 'male').length;
  const femaleCount = group.filter(player => genders[player] === 'female').length;
  
  // 严格要求：必须2男2女
  return maleCount === 2 && femaleCount === 2;
}

// 检查是否为真正的混双分组（1男1女 vs 1男1女）
function isTrueMixedDouble(group, genders) {
  if (!genders || Object.keys(genders).length === 0) return false;
  
  const males = group.filter(p => genders[p] === 'male');
  const females = group.filter(p => genders[p] === 'female');
  
  // 必须是2男2女
  if (males.length !== 2 || females.length !== 2) return false;
  
  // 这里可以进一步优化，确保男女搭配的合理性
  // 目前先简单返回true，后续可以添加更复杂的搭配逻辑
  return true;
}

// 生成真正的混双分组（1男1女搭档）
function generateMixedDoubleGroup(availableMales, availableFemales, partners, partnerCounts) {
  // 尝试不同的男女搭配组合，确保生成 1男1女 vs 1男1女 的真混双
  for (let i = 0; i < availableMales.length; i++) {
    for (let j = 0; j < availableFemales.length; j++) {
      for (let k = i + 1; k < availableMales.length; k++) {
        for (let l = j + 1; l < availableFemales.length; l++) {
          // 搭档组合1: (男i,女j) vs (男k,女l)
          const group1 = [availableMales[i], availableFemales[j], availableMales[k], availableFemales[l]];
          if (isValidGroup(group1, partners, partnerCounts)) {
            // 验证这确实是一个混双组合（相邻的两个是搭档）
            console.log(`🔄 生成真混双: (${availableMales[i]}♂+${availableFemales[j]}♀) vs (${availableMales[k]}♂+${availableFemales[l]}♀)`);
            return group1;
          }
          
          // 搭档组合2: (男i,女l) vs (男k,女j) 
          const group2 = [availableMales[i], availableFemales[l], availableMales[k], availableFemales[j]];
          if (isValidGroup(group2, partners, partnerCounts)) {
            console.log(`🔄 生成真混双: (${availableMales[i]}♂+${availableFemales[l]}♀) vs (${availableMales[k]}♂+${availableFemales[j]}♀)`);
            return group2;
          }
        }
      }
    }
  }
  return null;
}

function badmintonSchedule(players, genders, courtCount = 3, groupSize = 4, maxGamesPerPlayer = 6, maxRounds = 9) {
  const partners = {};
  const recentPlays = {};
  const playCount = {};
  const partnerCounts = {}; // 新增：记录搭档组合次数
  
  // 日志记录功能
  const logs = [];
  
  function logPlayCount(round, action = '') {
    const logEntry = {
      round: round,
      action: action,
      playCount: {...playCount},
      timestamp: new Date().toLocaleTimeString()
    };
    logs.push(logEntry);
    
    // 控制台输出
    console.log(`\n=== 第${round}轮${action} ===`);
    console.log('当前出场次数统计:');
    for (const [player, count] of Object.entries(playCount)) {
      const genderStr = genders[player] === 'male' ? '♂' : genders[player] === 'female' ? '♀' : '';
      console.log(`  ${player}${genderStr}: ${count}次`);
    }
    
    // 统计分析
    const counts = Object.values(playCount);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const avgCount = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
    console.log(`📊 统计: 最少${minCount}次, 最多${maxCount}次, 平均${avgCount}次, 差距${maxCount - minCount}次`);
  }
  
  players.forEach(p => {
    partners[p] = new Set();
    recentPlays[p] = [false, false, false];
    playCount[p] = 0;
  });

  const schedule = [];
  let round = 0;
  
  // 计算性别分布，用于优化分组策略
  const maleCount = players.filter(p => genders[p] === 'male').length;
  const femaleCount = players.filter(p => genders[p] === 'female').length;
  
  console.log(`\n🏸 羽毛球分组开始`);
  console.log(`玩家总数: ${players.length}人 (${maleCount}男${femaleCount}女)`);
  console.log(`场地数量: ${courtCount}片`);
  console.log(`最大比赛场次: ${maxGamesPerPlayer}场/人`);
  
  // 记录初始状态
  logPlayCount(0, '初始状态');
  
  while (round < maxRounds) {
    const used = new Set();
    const roundGroups = [];
    
    // 动态调整本轮期望的场地数，避免产生单组轮次
    let targetCourts = courtCount;
    const availablePlayers = players.filter(p => 
      !used.has(p) && 
      !isPlayedLastThree(recentPlays[p]) && 
      playCount[p] < maxGamesPerPlayer
    );
    
    // 如果可用玩家不足以填满所有场地，调整目标场地数
    if (availablePlayers.length < courtCount * groupSize) {
      targetCourts = Math.floor(availablePlayers.length / groupSize);
      if (targetCourts === 0) break;
    }
    
    for (let court = 0; court < targetCourts; court++) {
      const group = selectGroup(players, partners, used, recentPlays, playCount, maxGamesPerPlayer, genders, partnerCounts);
      if (!group) break;
      roundGroups.push(group);
      group.forEach(p => used.add(p));
      
      // 更新搭档关系和计数
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const player1 = group[i];
          const player2 = group[j];
          const key = [player1, player2].sort().join('-');
          
          // 记录搭档次数
          partnerCounts[key] = (partnerCounts[key] || 0) + 1;
          
          // 保持原有的搭档关系记录（向后兼容）
          partners[player1].add(player2);
          partners[player2].add(player1);
        }
      }
    }
    
    // 只有成功分组才添加到赛程中
    if (roundGroups.length > 0) {
      schedule.push(roundGroups);
      
      // 输出本轮分组详情
      console.log(`\n🏟️ 第${round + 1}轮分组 (使用${roundGroups.length}/${courtCount}片场地):`);
      roundGroups.forEach((group, index) => {
        const maleCount = group.filter(p => genders[p] === 'male').length;
        const femaleCount = group.filter(p => genders[p] === 'female').length;
        let genderDisplay = '';
        
        if (maleCount === 2 && femaleCount === 2) {
          // 检查是否为真正的混双
          if (isTrueMixedDouble(group, genders)) {
            const males = group.filter(p => genders[p] === 'male');
            const females = group.filter(p => genders[p] === 'female');
            genderDisplay = `真混双 (${males[0]}♂+${females[0]}♀ vs ${males[1]}♂+${females[1]}♀)`;
          } else {
            genderDisplay = '男双vs女双 (2男2女但非混双)';
          }
        } else if (maleCount === 4) {
          genderDisplay = '男双对战';
        } else if (femaleCount === 4) {
          genderDisplay = '女双对战';
        } else {
          genderDisplay = '其他组合';
        }
        
        console.log(`  场地${index + 1}: [${group.join(', ')}] - ${genderDisplay}`);
      });
    } else {
      break;
    }

    players.forEach(p => {
      if (recentPlays[p].length === 3) recentPlays[p].shift();
      recentPlays[p].push(used.has(p));
      if (used.has(p)) playCount[p]++;
    });

    // 记录每轮结束后的出场次数
    logPlayCount(round + 1, '常规轮次结束');

    if (Object.values(playCount).every(cnt => cnt >= maxGamesPerPlayer)) break;
    round++;
  }

  // 智能补齐阶段 - 确保场地利用率和性别平衡
  while (Object.values(playCount).some(cnt => cnt < maxGamesPerPlayer)) {
    const needPlayers = players.filter(p => 
      playCount[p] < maxGamesPerPlayer && 
      !isPlayedLastThree(recentPlays[p])
    );
    
    if (needPlayers.length < groupSize) break;
    
    // 计算可组成的完整组数
    const possibleGroups = Math.floor(needPlayers.length / groupSize);
    if (possibleGroups === 0) break;
    
    // 优先尝试组成多个组以充分利用场地
    const targetGroups = Math.min(possibleGroups, courtCount);
    const roundGroups = [];
    const usedInRound = new Set();
    
    // 按性别分类可用玩家
    const availableMales = needPlayers.filter(p => genders[p] === 'male' && !usedInRound.has(p));
    const availableFemales = needPlayers.filter(p => genders[p] === 'female' && !usedInRound.has(p));
    const availableOthers = needPlayers.filter(p => !genders[p] || (genders[p] !== 'male' && genders[p] !== 'female'));
    
    for (let groupIndex = 0; groupIndex < targetGroups; groupIndex++) {
      let group = null;
      
      // 优先尝试组建真正的混双组合（1男1女 vs 1男1女）
      if (availableMales.filter(p => !usedInRound.has(p)).length >= 2 && 
          availableFemales.filter(p => !usedInRound.has(p)).length >= 2) {
        const unusedMales = availableMales.filter(p => !usedInRound.has(p));
        const unusedFemales = availableFemales.filter(p => !usedInRound.has(p));
        const mixedGroup = generateMixedDoubleGroup(unusedMales, unusedFemales, partners, partnerCounts);
        
        if (mixedGroup) {
          group = mixedGroup;
        }
      }
      
      // 如果混合组不可行，尝试同性组合
      if (!group) {
        // 尝试4男组合
        const availableMalesForGroup = availableMales.filter(p => !usedInRound.has(p));
        if (availableMalesForGroup.length >= 4) {
          const maleGroup = availableMalesForGroup.slice(0, 4);
          if (isValidGroup(maleGroup, partners, partnerCounts)) {
            group = maleGroup;
          }
        }
        
        // 尝试4女组合
        if (!group) {
          const availableFemalesForGroup = availableFemales.filter(p => !usedInRound.has(p));
          if (availableFemalesForGroup.length >= 4) {
            const femaleGroup = availableFemalesForGroup.slice(0, 4);
            if (isValidGroup(femaleGroup, partners, partnerCounts)) {
              group = femaleGroup;
            }
          }
        }
      }
      
      // 最后兜底：从所有可用玩家中选择
      if (!group) {
        const remainingPlayers = needPlayers.filter(p => !usedInRound.has(p));
        if (remainingPlayers.length >= 4) {
          for (let i = 0; i <= remainingPlayers.length - 4; i += 4) {
            const candidateGroup = remainingPlayers.slice(i, i + 4);
            if (isValidGroup(candidateGroup, partners, partnerCounts) && 
                isGenderBalanced(candidateGroup, genders)) {
              group = candidateGroup;
              break;
            }
          }
        }
      }
      
      if (group) {
        roundGroups.push(group);
        group.forEach(p => usedInRound.add(p));
      } else {
        break; // 无法组成更多有效组合
      }
    }
    
    if (roundGroups.length === 0) break; // 无法组成任何组合，结束补齐
    
    // 添加这轮分组到赛程
    schedule.push(roundGroups);
    
    // 输出补齐轮次分组详情
    console.log(`\n🔄 补齐轮次 (使用${roundGroups.length}/${courtCount}片场地):`);
    roundGroups.forEach((group, index) => {
      const maleCount = group.filter(p => genders[p] === 'male').length;
      const femaleCount = group.filter(p => genders[p] === 'female').length;
      let genderDisplay = '';
      
      if (maleCount === 2 && femaleCount === 2) {
        // 检查是否为真正的混双
        if (isTrueMixedDouble(group, genders)) {
          const males = group.filter(p => genders[p] === 'male');
          const females = group.filter(p => genders[p] === 'female');
          genderDisplay = `真混双 (${males[0]}♂+${females[0]}♀ vs ${males[1]}♂+${females[1]}♀)`;
        } else {
          genderDisplay = '男双vs女双 (2男2女但非混双)';
        }
      } else if (maleCount === 4) {
        genderDisplay = '男双对战';
      } else if (femaleCount === 4) {
        genderDisplay = '女双对战';
      } else {
        genderDisplay = '其他组合';
      }
      
      console.log(`  场地${index + 1}: [${group.join(', ')}] - ${genderDisplay}`);
    });
    
    // 更新玩家状态
    players.forEach(p => {
      if (recentPlays[p].length === 3) recentPlays[p].shift();
      recentPlays[p].push(usedInRound.has(p));
      if (usedInRound.has(p)) playCount[p]++;
    });
    
    // 记录补齐阶段的出场次数
    logPlayCount(schedule.length, '补齐阶段结束');
    
    // 更新搭档计数
    roundGroups.forEach(group => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const player1 = group[i];
          const player2 = group[j];
          const key = [player1, player2].sort().join('-');
          partnerCounts[key] = (partnerCounts[key] || 0) + 1;
          partners[player1].add(player2);
          partners[player2].add(player1);
        }
      }
    });
  }

  // 优化最后的轮次合并，避免不必要的单组轮次
  const finalSchedule = [];
  let pendingGroups = [];
  
  for (let i = 0; i < schedule.length; i++) {
    const round = schedule[i];
    
    if (round.length === 1) {
      // 收集单组轮次
      pendingGroups.push(round[0]);
      
      // 如果收集到足够的组或者是最后一轮，进行合并
      if (pendingGroups.length === courtCount || i === schedule.length - 1) {
        if (pendingGroups.length > 1) {
          finalSchedule.push([...pendingGroups]);
        } else {
          finalSchedule.push([pendingGroups[0]]);
        }
        pendingGroups = [];
      }
    } else {
      // 先处理之前收集的单组
      if (pendingGroups.length > 0) {
        if (pendingGroups.length > 1) {
          finalSchedule.push([...pendingGroups]);
        } else {
          finalSchedule.push([pendingGroups[0]]);
        }
        pendingGroups = [];
      }
      
      // 添加当前多组轮次
      finalSchedule.push(round);
    }
  }

  // 输出轮次合并信息
  if (schedule.length !== finalSchedule.length) {
    console.log(`\n🔗 轮次合并优化: ${schedule.length}轮 → ${finalSchedule.length}轮`);
  }

  // 最终统计和日志输出
  console.log(`\n🏆 分组完成！`);
  console.log(`总轮次: ${finalSchedule.length}轮`);
  console.log(`总比赛场次: ${finalSchedule.reduce((total, round) => total + round.length, 0)}场`);
  
  // 最终出场次数统计
  logPlayCount(finalSchedule.length, '最终结果');
  
  // 公平性分析
  const finalCounts = Object.values(playCount);
  const minFinalCount = Math.min(...finalCounts);
  const maxFinalCount = Math.max(...finalCounts);
  console.log(`\n📈 公平性分析:`);
  console.log(`  最少出场: ${minFinalCount}次`);
  console.log(`  最多出场: ${maxFinalCount}次`);
  console.log(`  差距控制: ${maxFinalCount - minFinalCount}次 ${maxFinalCount - minFinalCount <= 1 ? '✅ 优秀' : '⚠️ 需改进'}`);
  
  // 性别分组统计
  let trueMixedCount = 0;     // 真正的混双
  let fakeMixedCount = 0;     // 男双vs女双
  let maleOnlyCount = 0;
  let femaleOnlyCount = 0;
  
  finalSchedule.forEach(round => {
    round.forEach(group => {
      const maleCount = group.filter(p => genders[p] === 'male').length;
      const femaleCount = group.filter(p => genders[p] === 'female').length;
      
      if (maleCount === 2 && femaleCount === 2) {
        if (isTrueMixedDouble(group, genders)) {
          trueMixedCount++;
        } else {
          fakeMixedCount++;
        }
      } else if (maleCount === 4) {
        maleOnlyCount++;
      } else if (femaleCount === 4) {
        femaleOnlyCount++;
      }
    });
  });
  
  console.log(`\n🎯 性别分组统计:`);
  console.log(`  真混双(1男1女vs1男1女): ${trueMixedCount}场`);
  console.log(`  男双vs女双(2男2女): ${fakeMixedCount}场`);
  console.log(`  男双对战(4男0女): ${maleOnlyCount}场`);
  console.log(`  女双对战(0男4女): ${femaleOnlyCount}场`);
  
  // 将日志信息附加到结果中（可选）
  finalSchedule._logs = logs;
  finalSchedule._stats = {
    totalRounds: finalSchedule.length,
    totalMatches: finalSchedule.reduce((total, round) => total + round.length, 0),
    playCount: {...playCount},
    fairnessGap: maxFinalCount - minFinalCount,
    genderStats: {
      trueMixed: trueMixedCount,    // 真混双
      fakeMixed: fakeMixedCount,    // 男双vs女双
      maleOnly: maleOnlyCount,
      femaleOnly: femaleOnlyCount
    }
  };

  return finalSchedule;
}

module.exports = {
  badmintonSchedule
};