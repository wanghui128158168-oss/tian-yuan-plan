export const STORAGE_KEY = 'goal_promoter_data'
export const THEME_KEY = 'goal_promoter_theme'
export const ACTIVITY_KEY = 'goal_promoter_activity'
export const DAILY_STEP_CAP = 5

export const PLANT_ACHIEVEMENTS = [
  { id: 'garden', name: '嫩芽', emoji: '🌱', desc: '完成第一个步骤', condition: (stats) => stats.totalSteps >= 1 },
  { id: 'seedling', name: '绿苗', emoji: '🌿', desc: '完成 3 个步骤', condition: (stats) => stats.totalSteps >= 3 },
  { id: 'cherry', name: '樱花', emoji: '🌸', desc: '完成第一个完整目标', condition: (stats) => stats.completedGoals >= 1 },
  { id: 'sunflower', name: '向日葵', emoji: '🌻', desc: '累计完成 30 个步骤（每天最多计 5 个）', condition: (stats) => stats.cappedSteps >= 30 },
  { id: 'strawberry', name: '草莓', emoji: '🍓', desc: '一天内完成 5 个步骤', condition: (stats) => stats.maxDaySteps >= 5 },
  { id: 'tomato', name: '番茄', emoji: '🍅', desc: '完成 2 个完整目标', condition: (stats) => stats.completedGoals >= 2 },
  { id: 'bamboo', name: '节节竹', emoji: '🎋', desc: '连续打卡 7 天', condition: (stats) => stats.maxStreak >= 7 },
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', desc: '同时进行 3 个目标', condition: (stats) => stats.activeGoals >= 3 },
  { id: 'clover', name: '四叶草', emoji: '🍀', desc: '同时进行 3 个目标 · 升级款', condition: (stats) => stats.activeGoals >= 3 },
  { id: 'corn', name: '玉米', emoji: '🌽', desc: '累计完成 50 个步骤', condition: (stats) => stats.cappedSteps >= 50 },
  { id: 'cactus', name: '仙人掌', emoji: '🌵', desc: '中断后重新坚持打卡', condition: (stats) => stats.hasRescued === true },
  { id: 'tree', name: '大树', emoji: '🌳', desc: '累计完成 100 个步骤', condition: (stats) => stats.cappedSteps >= 100 },
  { id: 'rose', name: '玫瑰', emoji: '🌹', desc: '完成 3 个完整目标', condition: (stats) => stats.completedGoals >= 3 },
  { id: 'lotus', name: '荷花', emoji: '🪷', desc: '连续打卡 14 天', condition: (stats) => stats.maxStreak >= 14 },
  { id: 'maple', name: '枫叶', emoji: '🍁', desc: '累计完成 200 个步骤', condition: (stats) => stats.cappedSteps >= 200 },
  { id: 'duck', name: '鸭鸭', emoji: '🦆', desc: '隐藏款 · 一天完成 10 个步骤', condition: (stats) => stats.maxDaySteps >= 10 },
  { id: 'frog', name: '蛙蛙', emoji: '🐸', desc: '隐藏款 · 完成 5 个完整目标', condition: (stats) => stats.completedGoals >= 5 },
  { id: 'cat', name: '耄耋猫', emoji: '🐱', desc: '隐藏款 · 连续打卡 30 天', condition: (stats) => stats.maxStreak >= 30 },
  { id: 'shield_dog', name: '刀盾狗狗', emoji: '🐶', desc: '隐藏款 · 同时进行 5 个目标', condition: (stats) => stats.activeGoals >= 5 },
  { id: 'crown', name: '皇冠', emoji: '👑', desc: '终极款 · 完成 10 个完整目标', condition: (stats) => stats.completedGoals >= 10 },
]

export const COACH_TOAST_MESSAGES = {
  harsh: ['🌶️ 还差得远', '🌶️ 没摆烂，继续', '🌶️ 算你及格', '🌶️ 别停下'],
  gentle: ['🌟 你超棒！', '🌟 慢慢来~', '🌟 看到了哦', '🌟 继续加油'],
  rational: ['🦉 已记录', '🦉 节奏稳定', '🦉 +1步骤', '🦉 状态良好'],
}

export const TASK_COLORS = {
  todo: '#6366f1',
  task: '#8b5cf6',
  progress: '#10b981'
}

export const INSPIRATION_TEMPLATES = [
  { name: "英语四六级词汇打卡", type: "progress", dailyTarget: 50 },
  { name: "梳理自考毕业论文大纲", type: "task" },
  { name: "优化产品实习简历并投递", type: "task" },
  { name: "精读一篇专业领域行业研报", type: "task" },
  { name: "完成期末复习思维导图", type: "task" },
  { name: "保持 30 分钟有氧运动", type: "progress", dailyTarget: 1 }
]

export const quickStartOptions = [
  { icon:'📚', label:'备考学习', desc:'考研/四六级/期末', goals:['考研备考'], prompt:'我想备考，帮我制定一个备考学习计划' },
  { icon:'💼', label:'求职实习', desc:'简历/投递/面试准备', goals:['秋招求职'], prompt:'我想找到一份满意的工作，帮我制定求职行动计划' },
  { icon:'🌱', label:'养成习惯', desc:'早起/运动/每日打卡', goals:['专业课学习'], prompt:'我想养成一个好习惯并坚持每天执行' },
  { icon:'💪', label:'健身减脂', desc:'减重/增肌/跑步打卡', goals:['健身计划'], prompt:'我想健身减脂，帮我制定运动和饮食计划' },
  { icon:'🎯', label:'技能提升', desc:'编程/设计/外语', goals:['技能提升'], prompt:'我想系统学习提升一项新技能' },
  { icon:'📖', label:'读书写作', desc:'每月读书/写作输出', goals:['读书计划'], prompt:'我想养成每天读书和写作的习惯' },
]

export const GEM_DATA = {
  common: [
    { name: '石英', emoji: '🤍', rarity: 'common' },
    { name: '玛瑙', emoji: '🟤', rarity: 'common' },
    { name: '虎眼石', emoji: '🟡', rarity: 'common' },
    { name: '孔雀石', emoji: '💚', rarity: 'common' },
  ],
  fine: [
    { name: '紫水晶', emoji: '🔮', rarity: 'fine' },
    { name: '橄榄石', emoji: '💛', rarity: 'fine' },
    { name: '月光石', emoji: '🌙', rarity: 'fine' },
    { name: '海蓝宝', emoji: '🧊', rarity: 'fine' },
  ],
  rare: [
    { name: '红宝石', emoji: '❤️', rarity: 'rare' },
    { name: '蓝宝石', emoji: '💙', rarity: 'rare' },
    { name: '翡翠', emoji: '💚', rarity: 'rare' },
    { name: '碧玺', emoji: '💜', rarity: 'rare' },
  ],
  legend: [
    { name: '祖母绿', emoji: '💎', rarity: 'legend' },
    { name: '坦桑石', emoji: '🌀', rarity: 'legend' },
  ],
  epic: [
    { name: '粉钻', emoji: '🌸', rarity: 'epic' },
    { name: '亚历山大变石', emoji: '🌈', rarity: 'epic' },
  ]
}

export const RARITY_CONFIG = {
  common:  { label: '普通', color: '#9CA3AF', prob: 0.55 },
  fine:    { label: '精良', color: '#8B5CF6', prob: 0.28 },
  rare:    { label: '稀有', color: '#3B82F6', prob: 0.12 },
  legend:  { label: '传说', color: '#F59E0B', prob: 0.04 },
  epic:    { label: '史诗', color: '#EC4899', prob: 0.01 },
}

export const CUT_COST_POINTS = 30
export const CUT_COST_ORE = 1
