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

function isValidGroup(group, partners) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (partners[group[i]].has(group[j])) {
        return false;
      }
    }
  }
  return true;
}

function isPlayedLastThree(dq) {
  return dq.length === 3 && dq.every(Boolean);
}

function selectGroup(players, partners, used, recentPlays, playCount, maxGamesPerPlayer) {
  const sorted = [...players].sort((a, b) => playCount[a] - playCount[b]);
  // 1. 优先选搭档全新组合
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
          if (isValidGroup(group, partners)) {
            return group;
          }
        }
      }
    }
  }
  // 2. 允许有搭档重复（只要不是全部都合作过）
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
          if (!isAllPartnered(group, partners)) {
            return group;
          }
        }
      }
    }
  }
  return null;
}

function badmintonSchedule(players, courtCount = 3, groupSize = 4, maxGamesPerPlayer = 6, maxRounds = 9) {
  const partners = {};
  const recentPlays = {};
  const playCount = {};
  players.forEach(p => {
    partners[p] = new Set();
    recentPlays[p] = [false, false, false];
    playCount[p] = 0;
  });

  const schedule = [];
  let round = 0;
  while (round < maxRounds) {
    const used = new Set();
    const roundGroups = [];
    for (let court = 0; court < courtCount; court++) {
      const group = selectGroup(players, partners, used, recentPlays, playCount, maxGamesPerPlayer);
      if (!group) break;
      roundGroups.push(group);
      group.forEach(p => used.add(p));
      for (let i = 0; i < group.length; i++) {
        for (let j = 0; j < group.length; j++) {
          if (i !== j) {
            partners[group[i]].add(group[j]);
          }
        }
      }
    }
    if (roundGroups.length < courtCount) break;
    schedule.push(roundGroups);

    players.forEach(p => {
      if (recentPlays[p].length === 3) recentPlays[p].shift();
      recentPlays[p].push(used.has(p));
      if (used.has(p)) playCount[p]++;
    });

    if (Object.values(playCount).every(cnt => cnt >= maxGamesPerPlayer)) break;
    round++;
  }

  // 补齐阶段
  while (Object.values(playCount).some(cnt => cnt < maxGamesPerPlayer)) {
    const needPlayers = players.filter(p => playCount[p] < maxGamesPerPlayer);
    if (needPlayers.length < groupSize) break;
    let arranged = false;
    for (let i = 0; i + 3 < needPlayers.length; i += 4) {
      const group = needPlayers.slice(i, i + 4);
      let canArrange = true;
      for (let p of group) {
        if (isPlayedLastThree(recentPlays[p])) {
          canArrange = false;
          break;
        }
      }
      if (!canArrange) continue;
      const roundGroups = [group];
      schedule.push(roundGroups);
      for (let p of group) {
        if (recentPlays[p].length === 3) recentPlays[p].shift();
        recentPlays[p].push(true);
        playCount[p]++;
      }
      players.forEach(p => {
        if (!group.includes(p)) {
          if (recentPlays[p].length === 3) recentPlays[p].shift();
          recentPlays[p].push(false);
        }
      });
      arranged = true;
    }
    if (!arranged) break;
  }

  // 合并最后的单组轮次
  let maxMerge = courtCount;
  let mergeCount = 0;
  let mergeGroups = [];
  for (let i = schedule.length - 1; i >= 0; i--) {
    let round = schedule[i];
    if (round.length === 1) {
      mergeGroups.push(round[0]);
      mergeCount++;
      if (mergeCount === maxMerge) break;
    } else {
      break;
    }
  }
  if (mergeCount > 1) {
    for (let i = 0; i < mergeCount; i++) {
      schedule.pop();
    }
    let mergedRound = [];
    for (let j = mergeGroups.length - 1; j >= 0; j--) {
      mergedRound.push(mergeGroups[j]);
    }
    schedule.push(mergedRound);
  }

  return schedule;
}

module.exports = {
  badmintonSchedule
};