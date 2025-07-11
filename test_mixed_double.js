// 测试真混双分组功能
const { badmintonSchedule } = require('./utils/scheduler.js');

// 测试场景：4女4男，2片场地 - 理想的真混双场景
const players = ['张三', '李四', '王五', '赵六', '小红', '小兰', '小美', '小丽'];
const genders = {
  '张三': 'male', '李四': 'male', '王五': 'male', '赵六': 'male',
  '小红': 'female', '小兰': 'female', '小美': 'female', '小丽': 'female'
};

console.log('🏸 测试真混双分组功能');
console.log('================================');
console.log('测试场景: 4男4女，2片场地');
console.log('期望结果: 应该生成真混双分组');

// 执行分组算法（会自动输出详细日志）
const result = badmintonSchedule(players, genders, 2, 4, 4, 6);

console.log('\n📋 最终赛程表:');
console.log('================================');
result.forEach((round, roundIndex) => {
  console.log(`第${roundIndex + 1}轮:`);
  round.forEach((group, groupIndex) => {
    const males = group.filter(p => genders[p] === 'male');
    const females = group.filter(p => genders[p] === 'female');
    if (males.length === 2 && females.length === 2) {
      console.log(`  场地${groupIndex + 1}: (${males[0]}♂+${females[0]}♀) vs (${males[1]}♂+${females[1]}♀)`);
    } else {
      console.log(`  场地${groupIndex + 1}: [${group.join(', ')}]`);
    }
  });
});

// 显示统计信息
if (result._stats) {
  console.log('\n📊 分组类型统计:');
  console.log('================================');
  console.log(`真混双: ${result._stats.genderStats.trueMixed}场`);
  console.log(`男双vs女双: ${result._stats.genderStats.fakeMixed}场`);
  console.log(`男双对战: ${result._stats.genderStats.maleOnly}场`);
  console.log(`女双对战: ${result._stats.genderStats.femaleOnly}场`);
}

console.log('\n✅ 测试完成');
