// 测试日志记录功能的示例
const { badmintonSchedule } = require('./utils/scheduler.js');

// 测试场景：4女6男，2片场地
const players = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '小红', '小兰', '小美', '小丽'];
const genders = {
  '张三': 'male', '李四': 'male', '王五': 'male', '赵六': 'male', '钱七': 'male', '孙八': 'male',
  '小红': 'female', '小兰': 'female', '小美': 'female', '小丽': 'female'
};

console.log('🏸 开始测试日志记录功能');
console.log('================================');

// 执行分组算法（会自动输出详细日志）
const result = badmintonSchedule(players, genders, 2, 4, 6, 9);

console.log('\n📋 最终赛程表:');
console.log('================================');
result.forEach((round, roundIndex) => {
  console.log(`第${roundIndex + 1}轮:`);
  round.forEach((group, groupIndex) => {
    console.log(`  场地${groupIndex + 1}: [${group.join(', ')}]`);
  });
});

// 显示附加的统计信息
if (result._stats) {
  console.log('\n📊 详细统计信息:');
  console.log('================================');
  console.log('总体数据:', result._stats);
}

console.log('\n✅ 测试完成');
