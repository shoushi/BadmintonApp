// 测试修复后的分组算法
const { badmintonSchedule } = require('./utils/scheduler.js');

// 测试场景：4女6男，2片场地
const players = ['男1', '男2', '男3', '男4', '男5', '男6', '女1', '女2', '女3', '女4'];
const genders = {
  '男1': 'male', '男2': 'male', '男3': 'male', '男4': 'male', '男5': 'male', '男6': 'male',
  '女1': 'female', '女2': 'female', '女3': 'female', '女4': 'female'
};

console.log('=== 测试场景：4女6男，2片场地 ===');
console.log('玩家列表:', players);
console.log('性别分布:', genders);
console.log('场地数量: 2');

const schedule = badmintonSchedule(players, genders, 2, 4, 6, 9);

console.log('\n=== 分组结果 ===');
schedule.forEach((round, roundIndex) => {
  console.log(`\n第${roundIndex + 1}轮:`);
  round.forEach((group, groupIndex) => {
    const maleCount = group.filter(p => genders[p] === 'male').length;
    const femaleCount = group.filter(p => genders[p] === 'female').length;
    console.log(`  场地${groupIndex + 1}: [${group.join(', ')}] (${maleCount}男${femaleCount}女)`);
  });
});

// 统计每人参赛次数
const playCount = {};
players.forEach(p => playCount[p] = 0);

schedule.forEach(round => {
  round.forEach(group => {
    group.forEach(player => {
      playCount[player]++;
    });
  });
});

console.log('\n=== 参赛次数统计 ===');
for (const [player, count] of Object.entries(playCount)) {
  console.log(`${player}: ${count}次`);
}

// 验证分组规则
console.log('\n=== 规则验证 ===');
let validGroups = 0;
let totalGroups = 0;

schedule.forEach(round => {
  round.forEach(group => {
    totalGroups++;
    const maleCount = group.filter(p => genders[p] === 'male').length;
    const femaleCount = group.filter(p => genders[p] === 'female').length;
    
    if ((maleCount === 2 && femaleCount === 2) || 
        (maleCount === 4 && femaleCount === 0) || 
        (maleCount === 0 && femaleCount === 4)) {
      validGroups++;
    } else {
      console.log(`❌ 违规分组: [${group.join(', ')}] (${maleCount}男${femaleCount}女)`);
    }
  });
});

console.log(`✅ 有效分组: ${validGroups}/${totalGroups}`);
console.log(`✅ 总轮次: ${schedule.length}`);
console.log(`✅ 平均每轮场地使用: ${(totalGroups / schedule.length).toFixed(1)}/2`);
