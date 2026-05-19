import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { callAI } from './utils/ai'
import PlantVisual from './PlantVisual'
import GrowingTree from './GrowingTree'
import BottomSheet from './BottomSheet'
import Onboarding from './Onboarding'
import {
  Trash2, Settings, Sun, Moon, Plus, CheckCircle2, XCircle, X,
  Sparkles, Egg, Focus, Bell, Edit3, Activity,
  ListTodo, Info, RefreshCw, Circle, Pin, ChevronLeft, ChevronRight
} from 'lucide-react'
import { COACH_STYLES, loadCoachStyle, saveCoachStyle, fireConfetti } from './utils/confetti'

// localStorage 保存的 key
const STORAGE_KEY = 'goal_promoter_data'
const THEME_KEY = 'goal_promoter_theme'
const ACTIVITY_KEY = 'goal_promoter_activity'

const DAILY_STEP_CAP = 5

const PLANT_ACHIEVEMENTS = [
  // === 新手快速解锁（第一天就能拿到 3-5 个）===
  {
    id: 'garden',
    name: '嫩芽',
    emoji: '🌱',
    desc: '完成第一个步骤',
    condition: (stats) => stats.totalSteps >= 1
  },
  {
    id: 'seedling',
    name: '绿苗',
    emoji: '🌿',
    desc: '完成 3 个步骤',
    condition: (stats) => stats.totalSteps >= 3
  },
  {
    id: 'cherry',
    name: '樱花',
    emoji: '🌸',
    desc: '完成第一个完整目标',
    condition: (stats) => stats.completedGoals >= 1
  },
  // === 进阶解锁 ===
  {
    id: 'sunflower',
    name: '向日葵',
    emoji: '🌻',
    desc: '累计完成 30 个步骤（每天最多计 5 个）',
    condition: (stats) => stats.cappedSteps >= 30
  },
  {
    id: 'strawberry',
    name: '草莓',
    emoji: '🍓',
    desc: '一天内完成 5 个步骤',
    condition: (stats) => stats.maxDaySteps >= 5
  },
  {
    id: 'tomato',
    name: '番茄',
    emoji: '🍅',
    desc: '完成 2 个完整目标',
    condition: (stats) => stats.completedGoals >= 2
  },
  {
    id: 'bamboo',
    name: '节节竹',
    emoji: '🎋',
    desc: '连续打卡 7 天',
    condition: (stats) => stats.maxStreak >= 7
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    emoji: '🥕',
    desc: '同时进行 3 个目标',
    condition: (stats) => stats.activeGoals >= 3
  },
  {
    id: 'clover',
    name: '四叶草',
    emoji: '🍀',
    desc: '同时进行 3 个目标 · 升级款',
    condition: (stats) => stats.activeGoals >= 3
  },
  {
    id: 'corn',
    name: '玉米',
    emoji: '🌽',
    desc: '累计完成 50 个步骤',
    condition: (stats) => stats.cappedSteps >= 50
  },
  {
    id: 'cactus',
    name: '仙人掌',
    emoji: '🌵',
    desc: '中断后重新坚持打卡',
    condition: (stats) => stats.hasRescued === true
  },
  // === 高难度解锁 ===
  {
    id: 'tree',
    name: '大树',
    emoji: '🌳',
    desc: '累计完成 100 个步骤',
    condition: (stats) => stats.cappedSteps >= 100
  },
  {
    id: 'rose',
    name: '玫瑰',
    emoji: '🌹',
    desc: '完成 3 个完整目标',
    condition: (stats) => stats.completedGoals >= 3
  },
  {
    id: 'lotus',
    name: '荷花',
    emoji: '🪷',
    desc: '连续打卡 14 天',
    condition: (stats) => stats.maxStreak >= 14
  },
  {
    id: 'maple',
    name: '枫叶',
    emoji: '🍁',
    desc: '累计完成 200 个步骤',
    condition: (stats) => stats.cappedSteps >= 200
  },
  // === 隐藏款 · 社交货币 ===
  {
    id: 'duck',
    name: '鸭鸭',
    emoji: '🦆',
    desc: '隐藏款 · 一天完成 10 个步骤',
    condition: (stats) => stats.maxDaySteps >= 10
  },
  {
    id: 'frog',
    name: '蛙蛙',
    emoji: '🐸',
    desc: '隐藏款 · 完成 5 个完整目标',
    condition: (stats) => stats.completedGoals >= 5
  },
  {
    id: 'cat',
    name: '耄耋猫',
    emoji: '🐱',
    desc: '隐藏款 · 连续打卡 30 天',
    condition: (stats) => stats.maxStreak >= 30
  },
  {
    id: 'shield_dog',
    name: '刀盾狗狗',
    emoji: '🐶',
    desc: '隐藏款 · 同时进行 5 个目标',
    condition: (stats) => stats.activeGoals >= 5
  },
  {
    id: 'crown',
    name: '皇冠',
    emoji: '👑',
    desc: '终极款 · 完成 10 个完整目标',
    condition: (stats) => stats.completedGoals >= 10
  },
]

// ===== 分享卡片 Canvas 工具 =====
const roundRectPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const buildShareCanvas = (collection, level, totalSteps, completedGoals, nickname) => {
  const W = 750
  const rows = Math.max(1, Math.ceil(collection.length / 5))
  const H = 320 + rows * 120 + 210
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#bfdbfe')
  bg.addColorStop(0.4, '#d1fae5')
  bg.addColorStop(1, '#f0fdf4')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 装饰：太阳 + 云
  ctx.font = '70px serif'; ctx.fillText('☀️', W - 95, 82)
  ctx.font = '48px serif'; ctx.fillText('☁️', 65, 75)
  ctx.font = '36px serif'; ctx.fillText('☁️', 200, 108)

  // 白色卡片背景
  ctx.fillStyle = 'rgba(255,255,255,0.68)'
  roundRectPath(ctx, 44, 118, W - 88, H - 220, 28)
  ctx.fill()

  // 绿点
  ctx.fillStyle = '#16a34a'
  ctx.beginPath(); ctx.arc(W/2, 152, 5, 0, Math.PI*2); ctx.fill()
  ctx.beginPath()
  ctx.arc(W/2, 152, 5, 0, Math.PI*2)
  ctx.strokeStyle = 'rgba(22,163,74,0.25)'; ctx.lineWidth = 6; ctx.stroke()

  // 标题
  ctx.fillStyle = '#166534'
  ctx.font = 'bold 48px -apple-system, PingFang SC, Helvetica, sans-serif'
  ctx.textAlign = 'center'
  const title = nickname ? `${nickname} 的田园` : '我的田园'
  ctx.fillText(title, W/2, 202)

  // 副标题
  ctx.fillStyle = '#4d7c0f'
  ctx.font = '28px -apple-system, PingFang SC, sans-serif'
  ctx.fillText(`收获了 ${collection.length} / 20 种作物`, W/2, 246)

  // 植物网格
  if (collection.length === 0) {
    ctx.font = '100px serif'; ctx.fillText('🌱', W/2, 360)
    ctx.fillStyle = '#4d7c0f'
    ctx.font = '28px -apple-system, PingFang SC, sans-serif'
    ctx.fillText('正在努力种第一株...', W/2, 430)
  } else {
    const cellW = 130, cellH = 120, cols = 5
    const gridW = cols * cellW
    const startX = (W - gridW) / 2 + cellW / 2
    const startY = 290
    collection.forEach((plant, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const x = startX + col * cellW, y = startY + row * cellH
      // 圆形底
      ctx.fillStyle = 'rgba(220,252,231,0.75)'
      ctx.beginPath(); ctx.arc(x, y, 38, 0, Math.PI*2); ctx.fill()
      // emoji
      ctx.font = '52px serif'; ctx.textAlign = 'center'
      ctx.fillText(plant.emoji, x, y + 18)
      // 名字
      ctx.fillStyle = '#166534'
      ctx.font = '18px -apple-system, PingFang SC, sans-serif'
      ctx.fillText(plant.name, x, y + 56)
    })
  }

  // 数据条
  const statsY = H - 195
  ctx.fillStyle = 'rgba(22,163,74,0.1)'
  roundRectPath(ctx, 64, statsY, W - 128, 88, 18); ctx.fill()
  const statsArr = [
    { num: String(totalSteps), label: '步骤完成' },
    { num: `Lv.${level}`, label: '当前等级' },
    { num: String(completedGoals), label: '目标达成' },
  ]
  statsArr.forEach((s, i) => {
    const x = W/2 + (i - 1) * 196
    ctx.fillStyle = '#166534'
    ctx.font = 'bold 38px -apple-system, PingFang SC, sans-serif'
    ctx.textAlign = 'center'; ctx.fillText(s.num, x, statsY + 40)
    ctx.fillStyle = '#4d7c0f'
    ctx.font = '20px -apple-system, PingFang SC, sans-serif'
    ctx.fillText(s.label, x, statsY + 68)
  })
  // 分隔线
  ctx.strokeStyle = 'rgba(22,163,74,0.2)'; ctx.lineWidth = 1
  ;[W/2 - 98, W/2 + 98].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, statsY + 14); ctx.lineTo(x, statsY + 74); ctx.stroke()
  })

  // 草地底部
  const grassGrad = ctx.createLinearGradient(0, H - 104, 0, H)
  grassGrad.addColorStop(0, '#22c55e'); grassGrad.addColorStop(1, '#15803d')
  ctx.fillStyle = grassGrad; ctx.fillRect(0, H - 90, W, 90)
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = 'bold 32px -apple-system, PingFang SC, sans-serif'
  ctx.textAlign = 'center'; ctx.fillText('🌱 田园计划', W/2, H - 52)
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '22px -apple-system, PingFang SC, sans-serif'
  ctx.fillText('goal-pusher.vercel.app', W/2, H - 22)

  return canvas
}

const COACH_TOAST_MESSAGES = {
  harsh: ['🌶️ 还差得远', '🌶️ 没摆烂，继续', '🌶️ 算你及格', '🌶️ 别停下'],
  gentle: ['🌟 你超棒！', '🌟 慢慢来~', '🌟 看到了哦', '🌟 继续加油'],
  rational: ['🦉 已记录', '🦉 节奏稳定', '🦉 +1步骤', '🦉 状态良好'],
}

// 三色标签系统
const TASK_COLORS = {
  todo: '#6366f1',
  task: '#8b5cf6',
  progress: '#10b981'
}

// 生成唯一 ID 的工具函数
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2)

const loadPlantCollection = () => {
  try {
    const saved = localStorage.getItem('plant_collection')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

const savePlantCollection = (data) => {
  localStorage.setItem('plant_collection', JSON.stringify(data))
}

const loadCappedSteps = () => {
  try {
    const saved = localStorage.getItem('plant_capped_steps')
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

const saveCappedSteps = (data) => {
  localStorage.setItem('plant_capped_steps', JSON.stringify(data))
}

const addCappedStep = () => {
  const today = getLocalDateStr()
  const data = loadCappedSteps()
  if (!data[today]) data[today] = 0
  if (data[today] < DAILY_STEP_CAP) {
    data[today]++
    saveCappedSteps(data)
    return true
  }
  return false
}

const getTotalCappedSteps = () => {
  const data = loadCappedSteps()
  return Object.values(data).reduce((sum, n) => sum + n, 0)
}

const loadCreditedSteps = () => {
  try { return new Set(JSON.parse(localStorage.getItem('plant_credited_steps') || '[]')) }
  catch { return new Set() }
}
const saveCreditedSteps = (set) => {
  localStorage.setItem('plant_credited_steps', JSON.stringify([...set]))
}

// 统一日期格式工具函数（本地时间，避免时区问题）
const getLocalDateStr = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getTomorrowStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return getLocalDateStr(d)
}

// 灵感模板库
const INSPIRATION_TEMPLATES = [
  { name: "英语四六级词汇打卡", type: "progress", dailyTarget: 50 },
  { name: "梳理自考毕业论文大纲", type: "task" },
  { name: "优化产品实习简历并投递", type: "task" },
  { name: "精读一篇专业领域行业研报", type: "task" },
  { name: "完成期末复习思维导图", type: "task" },
  { name: "保持 30 分钟有氧运动", type: "progress", dailyTarget: 1 }
]

// 随机抽取灵感模板
const getRandomInspirations = (count = 3) => {
  const shuffled = [...INSPIRATION_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// 创建灵感目标对象（用于外部调用）
const createInspirationGoal = (template) => ({
  id: generateId(),
  name: template.name,
  type: template.type,
  dailyTarget: template.dailyTarget || null,
  steps: [],
  notes: '',
  reminderTime: null,
  createdAt: Date.now(),
  progressLog: {},
  completed: false,
  dueDate: template.type === 'todo' ? getLocalDateStr() : null
})

// 创建新目标对象
const createNewGoal = (name, type, dailyTarget, dueDate = null, habitType = 'count') => ({
  id: generateId(),
  name: name.trim(),
  steps: [],
  notes: '',
  reminderTime: null,
  createdAt: Date.now(),
  type,
  dailyTarget: type === 'progress' ? dailyTarget : null,
  progressLog: {},
  completed: false,
  dueDate: type === 'todo' ? dueDate : null,
  habitType: type === 'progress' ? habitType : null
})

// 从 localStorage 读取数据
const loadData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []

    const goals = JSON.parse(saved)
    return goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      steps: (goal.steps || []).map(step => ({
        ...step,
        detail: step.detail || '',
        scheduledDate: step.scheduledDate || null,
        scheduledTime: step.scheduledTime || null,
        scheduledEndTime: step.scheduledEndTime || null
      })),
      notes: goal.notes || '',
      reminderTime: goal.reminderTime || null,
      createdAt: goal.createdAt || Date.now(),
      type: goal.type || 'task',
      dailyTarget: goal.dailyTarget || null,
      progressLog: goal.progressLog || {},
      completed: goal.completed || false,
      dueDate: goal.type === 'todo' ? (goal.dueDate || null) : null,
      habitType: goal.type === 'progress' ? (goal.habitType || 'count') : null,
      scheduledTime: goal.scheduledTime || null,
      scheduledEndTime: goal.scheduledEndTime || null
    }))
  } catch (e) {
    console.error('读取数据失败:', e)
    return []
  }
}

// 保存数据到 localStorage
const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存数据失败:', e)
  }
}

// 读取主题设置
const loadTheme = () => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) return saved
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// 保存主题设置
const saveTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme)
}

// 读取活动数据
const loadActivity = () => {
  const saved = localStorage.getItem(ACTIVITY_KEY)
  return saved ? JSON.parse(saved) : {}
}

// 保存活动数据
const saveActivity = (data) => {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存活动数据失败:', e)
  }
}

// 记录完成步骤的活动
const recordActivity = (dateStr = null) => {
  const activity = loadActivity()
  const today = dateStr || getLocalDateStr()
  activity[today] = (activity[today] || 0) + 1
  saveActivity(activity)
}

// 读取挽救日志
const loadRescueLog = () => {
  const saved = localStorage.getItem('goal_promoter_rescue_log')
  return saved ? JSON.parse(saved) : {}
}

// 保存挽救日志
const saveRescueLog = (data) => {
  localStorage.setItem('goal_promoter_rescue_log', JSON.stringify(data))
}

// 清理 JSON 字符串中的 markdown 代码块标记
const cleanJSON = (str) => {
  return str
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim()
}

// 计算两个日期之间的天数差
const daysBetween = (dateStr1, dateStr2) => {
  const d1 = new Date(dateStr1)
  const d2 = new Date(dateStr2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 日历辅助函数
const getWeekDays = (weekStartStr) => {
  const days = []
  const start = new Date(weekStartStr)
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(getLocalDateStr(day))
  }
  return days
}

const getWeekNumber = (dateStr) => {
  const date = new Date(dateStr)
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return { month, day, weekday, full: `${month}月${day}日 星期${weekday}` }
}

const getMonthDays = (year, month) => {
  const days = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const totalDays = lastDay.getDate()
  
  for (let i = 0; i < startPadding; i++) {
    days.push(null)
  }
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    days.push(getLocalDateStr(d))
  }
  return days
}

// 计算日常型目标的统计数据
const computeProgressStats = (goal, coachStyle) => {
  const { progressLog = {}, dailyTarget = 0 } = goal
  
  // 获取所有达标日期（progressLog[date] >= dailyTarget）
  const achievedDates = Object.entries(progressLog)
    .filter(([, value]) => value >= dailyTarget)
    .map(([date]) => date)
    .sort()
  
  const totalAchievedDays = achievedDates.length
  
  // 计算连续天数
  let currentStreak = 0
  let maxStreak = 0
  
  if (totalAchievedDays > 0) {
    // 计算所有连续段
    const streaks = []
    let currentStreakLength = 1
    
    for (let i = 1; i < achievedDates.length; i++) {
      const daysDiff = daysBetween(achievedDates[i - 1], achievedDates[i])
      if (daysDiff <= 2) {
        currentStreakLength++
      } else {
        streaks.push(currentStreakLength)
        currentStreakLength = 1
      }
    }
    streaks.push(currentStreakLength)
    
    maxStreak = Math.max(...streaks)
    
    // 计算当前连续天数
    const today = getLocalDateStr()
    const lastAchievedDate = achievedDates[achievedDates.length - 1]
    const daysSinceLastAchieved = daysBetween(lastAchievedDate, today)
    
    if (daysSinceLastAchieved <= 2) {
      // 找到最后一个连续段的长度
      let streakFromEnd = 1
      for (let i = achievedDates.length - 2; i >= 0; i--) {
        const daysDiff = daysBetween(achievedDates[i], achievedDates[i + 1])
        if (daysDiff <= 2) {
          streakFromEnd++
        } else {
          break
        }
      }
      currentStreak = streakFromEnd
    } else {
      currentStreak = 0
    }
  }
  
  // 计算挽救相关字段
  let canRescue = false
  let rescueUsedThisMonth = 0
  
  if (coachStyle !== 'harsh') {
    const today = new Date()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    
    // 获取本月已用挽救次数
    const rescueLog = loadRescueLog()
    rescueUsedThisMonth = rescueLog[goal.id]?.[currentMonth] || 0
    
    if (totalAchievedDays > 0) {
      const lastAchievedDate = achievedDates[achievedDates.length - 1]
      const daysSinceLastAchieved = daysBetween(lastAchievedDate, getLocalDateStr(today))
      
      // 情况1: currentStreak > 0 但最后达标日是前天（距今2天）
      if (currentStreak > 0 && daysSinceLastAchieved === 2) {
        canRescue = true
      }
      // 情况2: currentStreak = 0 但中断在24小时内（最后达标日是大前天，即3天前）且本月挽救次数 < 1
      else if (currentStreak === 0 && daysSinceLastAchieved === 3 && rescueUsedThisMonth < 1) {
        canRescue = true
      }
    }
  }
  
  // 计算植物阶段和健康状态
  const everHadStreak = maxStreak > 0
  let plantStage
  let plantHealth
  
  if (coachStyle === 'harsh') {
    if (currentStreak === 0 && everHadStreak) {
      plantStage = 0
      plantHealth = 'dead'
    } else if (currentStreak === 0) {
      plantStage = 0
      plantHealth = 'growing'
    } else if (currentStreak <= 2) {
      plantStage = 1
      plantHealth = 'growing'
    } else if (currentStreak <= 6) {
      plantStage = 2
      plantHealth = 'growing'
    } else if (currentStreak <= 13) {
      plantStage = 3
      plantHealth = 'thriving'
    } else if (currentStreak <= 29) {
      plantStage = 4
      plantHealth = 'thriving'
    } else {
      plantStage = 5
      plantHealth = 'thriving'
    }
  } else {
    const days = totalAchievedDays
    if (days === 0) {
      plantStage = 0
      plantHealth = 'growing'
    } else if (days <= 2) {
      plantStage = 1
      plantHealth = 'growing'
    } else if (days <= 6) {
      plantStage = 2
      plantHealth = 'growing'
    } else if (days <= 13) {
      plantStage = 3
      plantHealth = 'thriving'
    } else if (days <= 29) {
      plantStage = 4
      plantHealth = 'thriving'
    } else {
      plantStage = 5
      plantHealth = 'thriving'
    }
    
    if (plantHealth !== 'dead' && days > 0) {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const todayStr = getLocalDateStr(today)
      const yesterdayStr = getLocalDateStr(yesterday)
      const todayProgress = progressLog[todayStr] || 0
      const yesterdayProgress = progressLog[yesterdayStr] || 0
      
      if (todayProgress < dailyTarget && yesterdayProgress < dailyTarget) {
        plantHealth = 'wilting'
      }
    }
  }
  
  return {
    ...goal,
    currentStreak,
    maxStreak,
    totalAchievedDays,
    canRescue,
    rescueUsedThisMonth,
    plantStage,
    plantHealth
  }
}

// 请求浏览器通知权限
// Notification API 是浏览器提供的原生通知接口，需要用户授权才能使用
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false // 浏览器不支持通知
  }

  // 检查当前权限状态
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// 显示通知
const showNotification = (title, body) => {
  if (!('Notification' in window)) {
    return false // 浏览器不支持
  }

  if (Notification.permission !== 'granted') {
    return false // 未授权
  }

  // 创建并显示通知
  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg', // 使用网站图标
      badge: '/favicon.svg',
      requireInteraction: true // 保持通知显示直到用户关闭
    })
    return true
  } catch (e) {
    console.error('发送通知失败:', e)
    return false
  }
}

// 专注计时器组件
function FocusTimer({ selectedStep, onClose, onRecordActivity, onHabitComplete }) {
  const [minutes, setMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isWhiteNoiseOn, setIsWhiteNoiseOn] = useState(false)
  const [isMiniStart, setIsMiniStart] = useState(false)
  const [showDecision, setShowDecision] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState(0)
  const [abandoned, setAbandoned] = useState(false)
  
  const totalSeconds = minutes * 60
  const progress = (totalSeconds - timeLeft) / totalSeconds
  
  // Web Audio API 相关
  const audioContextRef = useRef(null)
  const noiseNodeRef = useRef(null)
  const gainNodeRef = useRef(null)

  // 生成白噪音
  const createWhiteNoise = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    
    const audioContext = audioContextRef.current
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    const whiteNoise = audioContext.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true
    
    // 创建低通滤波器，使声音更柔和
    const filter = audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    
    // 创建增益节点控制音量
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.1
    
    whiteNoise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    noiseNodeRef.current = whiteNoise
    gainNodeRef.current = gainNode
    
    whiteNoise.start()
  }

  // 停止白噪音
  const stopWhiteNoise = () => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop()
      noiseNodeRef.current = null
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect()
      gainNodeRef.current = null
    }
  }

  // 切换白噪音
  const toggleWhiteNoise = () => {
    if (isWhiteNoiseOn) {
      stopWhiteNoise()
      setIsWhiteNoiseOn(false)
    } else {
      createWhiteNoise()
      setIsWhiteNoiseOn(true)
    }
  }

  // 清理音频资源
  useEffect(() => {
    return () => {
      stopWhiteNoise()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // 倒计时逻辑
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          if (isMiniStart && !showDecision) {
            // 微起步模式首次完成，显示抉择
            setShowDecision(true)
            setFocusMinutes(prevFocus => prevFocus + 5)
          } else {
            // 正常完成或继续后的完成
            setIsFinished(true)
            stopWhiteNoise()
            // 记录专注成果
            if (onRecordActivity) {
              onRecordActivity()
            }
            // 如果是习惯，调用习惯完成回调
            if (selectedStep.isHabit && onHabitComplete) {
              onHabitComplete(selectedStep)
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft, isMiniStart, showDecision, onRecordActivity])

  // 格式化时间为 MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setTimeLeft(minutes * 60)
    setIsRunning(false)
    setIsFinished(false)
    setIsMiniStart(false)
    setShowDecision(false)
    setFocusMinutes(0)
    setAbandoned(false)
  }

  // 微起步开始
  const handleMiniStart = () => {
    setMinutes(5)
    setTimeLeft(5 * 60)
    setIsMiniStart(true)
    setShowDecision(false)
    setIsRunning(true)
  }

  // 顺势继续20分钟
  const handleContinue = () => {
    setMinutes(20)
    setTimeLeft(20 * 60)
    setShowDecision(false)
    setIsRunning(true)
  }

  // 见好就收
  const handleFinish = () => {
    // 记录这5分钟的成果
    if (onRecordActivity) {
      onRecordActivity()
    }
    setIsFinished(true)
    setShowDecision(false)
    stopWhiteNoise()
  }

  // 放弃按钮 - 播放枯萎动画
  const handleAbandon = () => {
    setIsRunning(false)
    stopWhiteNoise()
    setAbandoned(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const handleMinutesChange = (delta) => {
    const newMinutes = Math.max(1, Math.min(120, minutes + delta))
    setMinutes(newMinutes)
    if (!isRunning && !showDecision) {
      setTimeLeft(newMinutes * 60)
      setIsFinished(false)
    }
  }

  const handleClose = () => {
    if (isRunning) {
      showConfirm('确定放弃本次专注吗？', () => {
        setIsRunning(false)
        stopWhiteNoise()
        setAbandoned(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      })
    } else {
      onClose()
    }
  }

  // 严格检查：确保 selectedStep 有有效的数据才渲染
  if (!selectedStep || !selectedStep.id || !selectedStep.text) {
    return null
  }

  return (
    <div className="focus-timer-overlay" onClick={onClose}>
      <div className="focus-timmer-container" onClick={(e) => e.stopPropagation()}>

        <button className="focus-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <p className="focus-step-name">{selectedStep.text}</p>

        <div className="focus-tree-area">
          <GrowingTree progress={progress} abandoned={abandoned} />
        </div>

        <span className={`focus-time ${isFinished ? 'focus-finished' : ''}`}>
          {formatTime(timeLeft)}
        </span>

        {showDecision ? (
          <div className="focus-decision-state">
            <div className="decision-icon">🔥</div>
            <p className="decision-title">最难的启动已完成</p>
            <p className="decision-subtitle">要顺势继续吗？</p>
            <div className="decision-buttons">
              <button className="decision-btn decision-continue" onClick={handleContinue}>➡️ 继续 20 分钟</button>
              <button className="decision-btn decision-finish" onClick={handleFinish}>✅ 见好就收</button>
            </div>
          </div>
        ) : isFinished ? (
          <div className="focus-complete-alert">🎉 完成！休息一下吧~</div>
        ) : abandoned ? null : (
          <>
            {/* 开始/暂停 — 最核心按钮，放在时间正下方 */}
            <div className="focus-main-action">
              {isRunning ? (
                <button onClick={handlePause} className="focus-main-btn pause">⏸ 暂停</button>
              ) : (
                <button onClick={handleStart} className="focus-main-btn start">▶ 开始专注</button>
              )}
            </div>

            {/* 时间调整 */}
            <div className="focus-time-adjust">
              <button onClick={() => handleMinutesChange(-5)}>−5</button>
              <span>{minutes} 分钟</span>
              <button onClick={() => handleMinutesChange(+5)}>+5</button>
            </div>

            {/* 次要操作一排 */}
            <div className="focus-secondary-row">
              <button onClick={handleMiniStart} className="focus-secondary-btn">⚡ 先做5分钟</button>
              <button
                className={`focus-secondary-btn ${isWhiteNoiseOn ? 'active' : ''}`}
                onClick={toggleWhiteNoise}
              >
                🎧 {isWhiteNoiseOn ? '关闭' : '白噪音'}
              </button>
            </div>

            {isRunning && (
              <button onClick={handleAbandon} className="focus-abandon-btn">放弃</button>
            )}
          </>
        )}

      </div>
    </div>
  )
}

// 步骤项组件（单独提取以避免在 map 中使用 useState）
function StepItem({ step, goalId, todayStr, tomorrowStr, onToggleStep, onUpdateGoal, onSelectStep, onDeleteStep, handleStepTextChange }) {
  const [showDatePopover, setShowDatePopover] = useState(false)
  const stepDate = step.scheduledDate ? new Date(step.scheduledDate) : null
  const stepDateLabel = stepDate ? `${stepDate.getMonth() + 1}/${stepDate.getDate()}` : null

  const isOverdue = step.scheduledDate && step.scheduledDate < todayStr && !step.completed
  const isToday = step.scheduledDate === todayStr && !step.completed

  return (
    <div key={step.id} className={`step-item ${step.completed ? 'step-done' : ''} ${isToday ? 'step-today' : ''} ${isOverdue ? 'step-overdue-item' : ''}`}>
      <label className="step-checkbox">
        <input
          type="checkbox"
          checked={step.completed}
          onChange={() => onToggleStep(goalId, step.id)}
        />
        <span className="checkmark"></span>
      </label>
      {isOverdue && <span className="step-status-dot overdue" />}
      {isToday && <span className="step-status-dot today" />}
      <div className="step-text-group">
        <input
          type="text"
          className="step-text-title"
          value={step.text}
          onChange={(e) => handleStepTextChange(step.id, e.target.value)}
          onBlur={() => onUpdateGoal(goalId, (g) => g)}
          maxLength={8}
          placeholder="步骤名称"
        />
        {(step.detail && step.detail.trim()) && (
          <p className="step-text-detail">{step.detail}</p>
        )}
      </div>
      <div className="step-actions">
        {!step.completed && (
          <>
            <div className="step-date-wrapper">
              <button
                className={`step-date-btn ${stepDateLabel ? 'has-date' : ''}`}
                onClick={() => setShowDatePopover(!showDatePopover)}
              >
                {stepDateLabel ? `📅 ${stepDateLabel}` : '+ 排期'}
              </button>
              {showDatePopover && (
                <div className="step-date-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="step-date-quick">
                    <button onClick={() => {
                      onUpdateGoal(goalId, (g) => ({
                        ...g,
                        steps: g.steps.map(s =>
                          s.id === step.id ? { ...s, scheduledDate: todayStr } : s
                        )
                      }))
                      setShowDatePopover(false)
                    }}>今天</button>
                    <button onClick={() => {
                      onUpdateGoal(goalId, (g) => ({
                        ...g,
                        steps: g.steps.map(s =>
                          s.id === step.id ? { ...s, scheduledDate: tomorrowStr } : s
                        )
                      }))
                      setShowDatePopover(false)
                    }}>明天</button>
                    <button onClick={() => {
                      const dayAfter = new Date()
                      dayAfter.setDate(dayAfter.getDate() + 2)
                      const dayAfterStr = getLocalDateStr(dayAfter)
                      onUpdateGoal(goalId, (g) => ({
                        ...g,
                        steps: g.steps.map(s =>
                          s.id === step.id ? { ...s, scheduledDate: dayAfterStr } : s
                        )
                      }))
                      setShowDatePopover(false)
                    }}>后天</button>
                  </div>
                  <input
                    type="date"
                    className="step-date-input"
                    value={step.scheduledDate || ''}
                    onChange={(e) => {
                      onUpdateGoal(goalId, (g) => ({
                        ...g,
                        steps: g.steps.map(s =>
                          s.id === step.id ? { ...s, scheduledDate: e.target.value || null } : s
                        )
                      }))
                      setShowDatePopover(false)
                    }}
                  />
                  {step.scheduledDate && (
                    <button
                      className="step-date-clear"
                      onClick={() => {
                        onUpdateGoal(goalId, (g) => ({
                          ...g,
                          steps: g.steps.map(s =>
                            s.id === step.id ? { ...s, scheduledDate: null } : s
                          )
                        }))
                        setShowDatePopover(false)
                      }}
                    >
                      清除排期
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              className="step-focus-shortcut"
              title="开始专注"
              onClick={(e) => {
                e.stopPropagation()
                onSelectStep(step)
              }}
            >
              <Focus size={14} />
            </button>
          </>
        )}
        <button
          className="delete-step-btn"
          onClick={() => onDeleteStep(goalId, step.id)}
          title="删除步骤"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  )
}

function GoalCard({ goal, onUpdateGoal, onDeleteGoal, onAddStep, onToggleStep, onDeleteStep, onSelectStep, onRequestNotification, onAIDecompose, onCoachReview, onAddExp, todayStr, tomorrowStr, showToast, onOpenDecompose, inCardDecomposeId, setInCardDecomposeId, quickTimeframe, setQuickTimeframe, quickBackground, setQuickBackground, handleQuickAIDecompose, setQuickGoalPending, setPendingDecomposeGoalId }) {
  const completedSteps = (goal.steps ?? []).filter((s) => s.completed).length
  const totalSteps = (goal.steps ?? []).length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderTime, setReminderTime] = useState('20:00')
  const [showAddStepInput, setShowAddStepInput] = useState(false)
  const [addStepText, setAddStepText] = useState('')
  const [isExpanded, setIsExpanded] = useState(!goal.completed)
  const [showNotes, setShowNotes] = useState(false)
  const [goalTitleEdit, setGoalTitleEdit] = useState(null)

  // 打开弹窗时：从最新的 goal 对象中获取时间，确保使用最新引用
  const openReminderModal = () => {
    // 关键：使用传入的最新 goal prop，而不是缓存的旧值
    setReminderTime(goal.reminderTime || '20:00')
    setShowReminderModal(true)
  }

  // 关闭弹窗时：强制清空本地状态，防止残留数据
  const closeReminderModal = () => {
    setReminderTime('20:00') // 重置为默认值
    setShowReminderModal(false)
  }

  const handleAddStep = () => {
    setShowAddStepInput(true)
    setAddStepText('')
  }

  const handleConfirmAddStep = () => {
    if (addStepText.trim()) {
      onAddStep(goal.id, addStepText.trim())
    }
    setShowAddStepInput(false)
    setAddStepText('')
  }

  const handleCancelAddStep = () => {
    setShowAddStepInput(false)
    setAddStepText('')
  }

  const handleAddStepKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirmAddStep()
    } else if (e.key === 'Escape') {
      handleCancelAddStep()
    }
  }

  const handleStepTextChange = (stepId, newText) => {
    onUpdateGoal(goal.id, (g) => ({
      ...g,
      steps: g.steps.map((s) => (s.id === stepId ? { ...s, text: newText } : s)),
    }))
  }

  const handleSaveReminder = async () => {
    // 请求通知权限
    const permissionGranted = await onRequestNotification()
    
    if (permissionGranted) {
      // 使用暴力深拷贝机制确保状态更新
      onUpdateGoal(goal.id, (g) => {
        // 使用深拷贝创建全新对象，确保引用完全更新
        const updatedGoal = JSON.parse(JSON.stringify(g))
        updatedGoal.reminderTime = reminderTime
        return updatedGoal
      })
      closeReminderModal() // 使用带重置的关闭函数
    } else {
      showToast('请先允许浏览器通知权限，否则无法接收提醒', 'error')
    }
  }

  const handleRemoveReminder = () => {
    // 使用暴力深拷贝机制
    onUpdateGoal(goal.id, (g) => {
      const updatedGoal = JSON.parse(JSON.stringify(g))
      updatedGoal.reminderTime = null
      return updatedGoal
    })
  }

  return (
    <div className={`goal-card ${goal.completed ? 'completed' : ''}`}>
      
      {/* 卡片头部——点击折叠/展开 */}
      <div className="goal-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="goal-card-header-left">
          <input
            type="text"
            className="goal-card-title-input"
            value={goalTitleEdit ?? goal.name}
            maxLength={12}
            onClick={e => e.stopPropagation()}
            onChange={e => setGoalTitleEdit(e.target.value)}
            onBlur={() => {
              if (goalTitleEdit !== null && goalTitleEdit.trim()) {
                onUpdateGoal(goal.id, g => ({ ...g, name: goalTitleEdit.trim() }))
              }
              setGoalTitleEdit(null)
            }}
            onFocus={e => { setGoalTitleEdit(goal.name); e.target.select() }}
          />
          {goal.note && <p className="goal-note">{goal.note}</p>}
          {goal.type === 'task' && (
            <>
              <div className="goal-progress-bar">
                <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="goal-card-meta">
                {goal.completed ? '✅ 已完成' : `${completedSteps} / ${totalSteps} 步骤`}
              </span>
            </>
          )}
          {goal.type === 'todo' && (
            <span className="goal-card-meta">
              {goal.completed ? '✅ 已完成' : goal.dueDate ? `📅 ${goal.dueDate}` : '未安排时间'}
            </span>
          )}
          {goal.type === 'progress' && (() => {
            const _stats = computeProgressStats(goal, loadCoachStyle())
            return (
              <span className="goal-card-meta">
                {_stats.currentStreak > 0 ? `🔥 连续 ${_stats.currentStreak} 天` : `累计 ${_stats.totalAchievedDays} 天`}
              </span>
            )
          })()}
        </div>
        <div className="goal-card-header-right">
          <span className="goal-expand-arrow">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* 折叠内容 */}
      {isExpanded && (
        <div className="goal-card-body">
          {/* 步骤列表 */}
          {/* 步骤列表和 AI 拆解（仅目标类型显示） */}
          {goal.type === 'task' && (
            <>
              <div className="steps-list">
                {goal.steps.map(step => (
                  <StepItem
                    key={step.id}
                    step={step}
                    goalId={goal.id}
                    onToggleStep={onToggleStep}
                    onDeleteStep={onDeleteStep}
                    onUpdateGoal={onUpdateGoal}
                    onSelectStep={onSelectStep}
                    todayStr={todayStr}
                    tomorrowStr={tomorrowStr}
                    showToast={showToast}
                    readOnly={goal.completed}
                  />
                ))}
              </div>

              {/* 添加步骤 + AI 拆解（只在未完成目标显示） */}
              {!goal.completed && (
                <>
                  {showAddStepInput ? (
                    <div className="add-step-input-wrapper">
                      <input
                        type="text"
                        className="add-step-input"
                        value={addStepText}
                        onChange={(e) => setAddStepText(e.target.value)}
                        onKeyDown={handleAddStepKeyDown}
                        placeholder="输入步骤名称..."
                        autoFocus
                      />
                      <button className="add-step-confirm-btn" onClick={handleConfirmAddStep}>确认</button>
                      <button className="add-step-cancel-btn" onClick={handleCancelAddStep}>取消</button>
                    </div>
                  ) : (
                    <button className="add-step-btn" onClick={handleAddStep}>
                      <Plus size={14} /> 添加步骤
                    </button>
                  )}
                  {!goal.steps || goal.steps.length === 0 ? (
                    <button
                      className={`coach-btn ${goal.isDecomposing ? 'loading' : ''}`}
                      onClick={() => { setQuickGoalPending(goal.name); setPendingDecomposeGoalId(goal.id); setInCardDecomposeId(goal.id); setQuickTimeframe(''); setQuickBackground(''); }}
                      disabled={goal.isDecomposing}
                    >
                      {goal.isDecomposing ? '✨ AI 拆解中...' : '✨ AI 帮我拆解步骤'}
                    </button>
                  ) : (
                    <button
                      className={`coach-btn ${goal.isDecomposing ? 'loading' : ''}`}
                      onClick={() => { setQuickGoalPending(goal.name); setPendingDecomposeGoalId(goal.id); setInCardDecomposeId(goal.id); setQuickTimeframe(''); setQuickBackground(''); }}
                      disabled={goal.isDecomposing}
                      style={{fontSize: '13px', opacity: 0.6}}
                    >
                      步骤不合适？重新拆
                    </button>
                  )}
                </>
              )}

              {inCardDecomposeId === goal.id && (
                <div className="quick-context-card" style={{marginTop:8}}>
                  <p className="quick-context-tip">多告诉我一点，步骤更贴合你</p>
                  <div className="quick-context-row">
                    <span className="quick-context-label">大概多久完成？</span>
                    <div className="quick-chips">
                      {['1个月内','3个月','半年','更长'].map(t => (
                        <button key={t} className={`quick-chip${quickTimeframe===t?' quick-chip-active':''}`} onClick={()=>setQuickTimeframe(quickTimeframe===t?'':t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{position:'relative'}}>
                    <input className="quick-context-input" placeholder="补充背景（选填），最多50字" maxLength={50} value={quickBackground} onChange={e=>setQuickBackground(e.target.value)} />
                    <span style={{fontSize:11,color:'var(--text-light)',textAlign:'right',display:'block',marginTop:2}}>{quickBackground.length}/50</span>
                  </div>
                  <div className="quick-context-actions">
                    <button className="quick-context-cancel" onClick={()=>{ setInCardDecomposeId(null); setQuickTimeframe(''); setQuickBackground(''); }}>取消</button>
                    <button className="quick-context-submit" onClick={()=>{ setInCardDecomposeId(null); handleQuickAIDecompose(goal.name, quickTimeframe, quickBackground); }}>开始拆解 →</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 待办专属：完成按钮 */}
          {goal.type === 'todo' && !goal.completed && (
            <div className="todo-actions">
              <div className="todo-date-row">
                <div className="todo-date-info">
                  <span className="todo-date-text">{goal.dueDate ? new Date(goal.dueDate).toLocaleDateString('zh-CN', {month:'numeric',day:'numeric'}) + '日' : '未安排'}</span>
                  <span className="todo-countdown">{(() => {
                    if (!goal.dueDate) return '点击安排日期'
                    const diff = Math.ceil((new Date(goal.dueDate) - new Date(new Date().toDateString())) / 86400000)
                    if (diff > 0) return `还剩 ${diff} 天`
                    if (diff === 0) return '今天截止'
                    return `已过期 ${Math.abs(diff)} 天`
                  })()}</span>
                </div>
                <label className="todo-date-change-btn">
                  修改日期
                  <input type="date" value={goal.dueDate || ''} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); onUpdateGoal(goal.id, g => ({...g, dueDate: e.target.value})); showToast('📅 日期已更新', 'success') }} style={{position:'absolute',opacity:0,width:0,height:0}} />
                </label>
              </div>
              <button className="todo-complete-btn" onClick={(e) => {
                e.stopPropagation()
                onUpdateGoal(goal.id, g => ({ ...g, completed: true }))
                import('canvas-confetti').then((m) => m.default({ particleCount: 120, spread: 70, origin: { y: 0.6 }, zIndex: 9999 }))
                showToast('✅ 待办已完成', 'success')
              }}>
                ✓ 标记完成
              </button>
            </div>
          )}

          {/* 习惯专属：打卡 + 连续天数 */}
          {goal.type === 'progress' && (() => {
            const _s = computeProgressStats(goal, loadCoachStyle())
            const _today = new Date().toISOString().split('T')[0]
            const _todayDone = (goal.progressLog?.[_today] || 0) >= (goal.dailyTarget || 1)
            return (
              <div className="habit-tracking-card">
                <div className="habit-stats-row">
                  <div className="habit-stat">
                    <span className="habit-stat-num">{_s.currentStreak}</span>
                    <span className="habit-stat-label">连续天数</span>
                  </div>
                  <div className="habit-stat">
                    <span className="habit-stat-num">{_s.totalAchievedDays}</span>
                    <span className="habit-stat-label">累计天数</span>
                  </div>
                  <div className="habit-stat">
                    <span className="habit-stat-num">{_s.maxStreak}</span>
                    <span className="habit-stat-label">最长记录</span>
                  </div>
                </div>
                {!_todayDone ? (
                  <button className="habit-checkin-btn" onClick={(e) => {
                    e.stopPropagation()
                    const today = new Date().toISOString().split('T')[0]
                    onUpdateGoal(goal.id, g => ({
                      ...g,
                      progressLog: { ...g.progressLog, [today]: (g.progressLog?.[today] || 0) + 1 }
                    }))
                    if (typeof onAddExp === 'function') onAddExp(15)
                    showToast('🔥 今日已打卡！', 'success')
                  }}>
                    今日打卡
                  </button>
                ) : (
                  <div className="habit-done-today">✓ 今日已完成</div>
                )}
              </div>
            )
          })()}

          {/* 教练点评（仅目标类型） */}
          {goal.type === 'task' && !goal.completed && (
            <div className="goal-actions-row">
              <button
                className={`coach-call-btn ${goal.isCoachReviewing ? 'loading' : ''}`}
                onClick={() => onCoachReview(goal.id)}
                disabled={goal.isCoachReviewing}
              >
                <Activity size={14} />
                {goal.isCoachReviewing ? '教练思考中...' : '召唤教练点评'}
              </button>
              <button
                className="notes-btn"
                onClick={() => setShowNotes(!showNotes)}
              >
                <Edit3 size={14} /> 笔记
              </button>
            </div>
          )}

          {/* 教练反馈（仅目标） */}
          {goal.type === 'task' && goal.coachFeedback && (() => {
            const _cs = COACH_STYLES[loadCoachStyle()] || COACH_STYLES.gentle
            return (
            <div className="coach-feedback-card" style={{borderLeftColor: _cs.color}}>
              <div className="coach-feedback-header">
                <span className="coach-name-tag" style={{background: _cs.color + '18', color: _cs.color}}>
                  {_cs.name}
                </span>
                <span className="coach-tag-label">专项点评</span>
              </div>
              <div className="coach-feedback-content">{goal.coachFeedback}</div>
            </div>
            )
          })()}

          {/* 笔记区（仅目标，折叠） */}
          {goal.type === 'task' && showNotes && !goal.completed && (
            <textarea
              className="reflection-textarea"
              placeholder="写下你的反思、进展、遇到的困难..."
              value={goal.notes || ''}
              onChange={e => onUpdateGoal(goal.id, g => ({ ...g, notes: e.target.value }))}
            />
          )}

          <div className="goal-card-footer">
            {!goal.completed && (
              <button className="footer-btn" onClick={(e) => { e.stopPropagation(); openReminderModal(); }}>
                <Bell size={13} /> 提醒
              </button>
            )}
            <button className="footer-btn danger" onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id) }}>
              <Trash2 size={13} /> 删除
            </button>
          </div>
        </div>
      )}

      {/* 提醒设置弹窗 */}
      {showReminderModal && (
        <div className="reminder-overlay" onClick={closeReminderModal}>
          <div className="reminder-modal" onClick={(e) => e.stopPropagation()}>
            <button className="reminder-close" onClick={closeReminderModal}>×</button>
            <h3>设置提醒</h3>
            <p className="reminder-hint">选择每天提醒你的时间</p>
            
            <div className="reminder-time-picker">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="time-input"
              />
            </div>

            <div className="reminder-controls">
              {goal.reminderTime && (
                <button className="reminder-btn-remove" onClick={handleRemoveReminder}>
                  关闭提醒
                </button>
              )}
              <button className="reminder-btn-save" onClick={handleSaveReminder}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 主应用组件
const quickStartOptions = [
  { icon:'📚', label:'备考学习', desc:'考研/四六级/期末', goals:['考研备考'], prompt:'我想备考，帮我制定一个备考学习计划' },
  { icon:'💼', label:'求职实习', desc:'简历/投递/面试准备', goals:['秋招求职'], prompt:'我想找到一份满意的工作，帮我制定求职行动计划' },
  { icon:'🌱', label:'养成习惯', desc:'早起/运动/每日打卡', goals:['专业课学习'], prompt:'我想养成一个好习惯并坚持每天执行' },
  { icon:'💪', label:'健身减脂', desc:'减重/增肌/跑步打卡', goals:['健身计划'], prompt:'我想健身减脂，帮我制定运动和饮食计划' },
  { icon:'🎯', label:'技能提升', desc:'编程/设计/外语', goals:['技能提升'], prompt:'我想系统学习提升一项新技能' },
  { icon:'📖', label:'读书写作', desc:'每月读书/写作输出', goals:['读书计划'], prompt:'我想养成每天读书和写作的习惯' },
]

function App() {
  // 全局 EXP 和 Level 状态
  const [globalExp, setGlobalExp] = useState(() => {
    const saved = localStorage.getItem('global_exp')
    return saved ? parseInt(saved) : 0
  })
  const [globalLevel, setGlobalLevel] = useState(() => {
    const saved = localStorage.getItem('global_level')
    return saved ? parseInt(saved) : 1
  })
  const globalLevelRef = useRef(globalLevel)

  useEffect(() => {
    globalLevelRef.current = globalLevel
  }, [globalLevel])

  // 灵感库状态
  const [inspirations, setInspirations] = useState(() => getRandomInspirations(3))

  // 刷新灵感库
  const refreshInspirations = () => {
    setInspirations(getRandomInspirations(3))
  }

  // 从灵感创建目标
  const createFromInspiration = (template) => {
    const newGoal = createInspirationGoal(template)
    setGoals(prev => [newGoal, ...prev])
    showToast(`已创建目标：${template.name}`, 'success')
  }

  // 数据状态：所有目标
  const [goals, setGoals] = useState(loadData)

  // Tab 导航状态
  const [activeTab, setActiveTab] = useState('calendar')

  // 日历视图状态
  const [calendarView, setCalendarView] = useState('week')
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateStr())
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    return getLocalDateStr(monday)
  })

  // 当前选中的步骤（用于计时器）
  const [selectedStep, setSelectedStep] = useState(null)

  // FocusTimer 显示控制（双重保护）
  const [isFocusActive, setIsFocusActive] = useState(false)

  // Toast 提示状态
  const [toast, setToast] = useState(null)

  // ConfirmDialog 状态
  const [confirmDialog, setConfirmDialog] = useState(null)

  // 显示确认对话框的辅助函数
  const showConfirm = (messageOrObj, onConfirm) => {
    if (typeof messageOrObj === 'string') {
      setConfirmDialog({ message: messageOrObj, onConfirm })
    } else {
      setConfirmDialog({ ...messageOrObj, onConfirm })
    }
  }

  // 新建目标弹窗状态
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalType, setNewGoalType] = useState('task')
  const [fabPreselectedType, setFabPreselectedType] = useState(null)
  const [newGoalDailyTarget, setNewGoalDailyTarget] = useState(30)
  const [newGoalDueDate, setNewGoalDueDate] = useState(() => getLocalDateStr())
  const [quickGoalText, setQuickGoalText] = useState('')
  const [quickStartOffset, setQuickStartOffset] = useState(0)
  const [isQuickDecomposing, setIsQuickDecomposing] = useState(false)
  const [showQuickContext, setShowQuickContext] = useState(false)
  const [quickGoalPending, setQuickGoalPending] = useState('')
  const [quickTimeframe, setQuickTimeframe] = useState('')
  const [quickBackground, setQuickBackground] = useState('')
  const [pendingDecomposeGoalId, setPendingDecomposeGoalId] = useState(null)
  const [inCardDecomposeId, setInCardDecomposeId] = useState(null)
  const [newHabitType, setNewHabitType] = useState('checkin')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // 学期计划生成器弹窗状态
  const [showGeneratePlanModal, setShowGeneratePlanModal] = useState(false)
  const [planGeneratorLoading, setPlanGeneratorLoading] = useState(false)
  const [planIdentity, setPlanIdentity] = useState('大一')
  const [planGoals, setPlanGoals] = useState([])
  const [planCustomGoal, setPlanCustomGoal] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [planTimeframe, setPlanTimeframe] = useState('3-6个月')
  const [showDecomposeModal, setShowDecomposeModal] = useState(false)
  const [decomposeGoalId, setDecomposeGoalId] = useState(null)
  const [decomposeWeeks, setDecomposeWeeks] = useState('4周')
  const [decomposeHours, setDecomposeHours] = useState('1小时')

  const togglePlanGoal = (goal) => {
    setPlanGoals(prev => {
      if (prev.includes(goal)) return prev.filter(g => g !== goal)
      if (prev.length >= 2) {
        showToast('最多选择 2 个目标哦', 'info')
        return prev
      }
      return [...prev, goal]
    })
  }

  // 每周AI洞察状态
  const [weeklyInsightData, setWeeklyInsightData] = useState(() => {
    const saved = localStorage.getItem('garden_weekly_insight')
    return saved ? JSON.parse(saved) : null
  })
  const [weeklyInsightLoading, setWeeklyInsightLoading] = useState(false)

  // FAB 弹窗状态
  const [showFABPanel, setShowFABPanel] = useState(false)

  // 常用日期缓存
  const todayStr = getLocalDateStr()
  const tomorrowStr = getTomorrowStr()

  // 主题状态 - 自动跟随系统
  const [theme, setTheme] = useState(loadTheme)
  
  // 自动跟随系统暗色模式
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light')
    setTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 活动数据（用于热力图）

  // 教练风格状态
  const [coachStyle, setCoachStyle] = useState(loadCoachStyle)

  // 设置弹窗状态
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [gardenNickname, setGardenNickname] = useState(() => localStorage.getItem('garden_nickname') || '')
  const [showCompletedGoals, setShowCompletedGoals] = useState(false)
  const [taskFilter, setTaskFilter] = useState('task')

  // PWA 安装引导状态
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  // 首次引导状态
  const [showInstallGuide, setShowInstallGuide] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(display-mode: standalone)').matches) return false
    if (window.navigator.standalone) return false
    if (localStorage.getItem('install_guide_dismissed') === 'true') return false
    const visits = parseInt(localStorage.getItem('app_visits') || '0', 10) + 1
    localStorage.setItem('app_visits', String(visits))
    return visits === 3
  })

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('garden_onboarded')
  })

  // 复盘提醒设置
  const [reviewReminder, setReviewReminder] = useState(() => {
    const saved = localStorage.getItem('garden_review_reminder')
    return saved ? JSON.parse(saved) : { enabled: false, time: '21:00' }
  })

  // 记录进度弹窗状态
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [currentGoalForRecord, setCurrentGoalForRecord] = useState(null)
  const [recordValue, setRecordValue] = useState(0)

  // 任务时间安排 BottomSheet 状态
  const [showTimeSheet, setShowTimeSheet] = useState(false)
  const [timeSheetTask, setTimeSheetTask] = useState(null)
  const [timeSheetType, setTimeSheetType] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // 日复盘状态
  const [dailyReviewText, setDailyReviewText] = useState(() => {
    const today = getLocalDateStr()
    const saved = localStorage.getItem('goal_daily_review')
    if (saved) {
      const data = JSON.parse(saved)
      return data[today]?.text || ''
    }
    return ''
  })
  const [aiComment, setAiComment] = useState(() => {
    const today = getLocalDateStr()
    const saved = localStorage.getItem('goal_daily_review')
    if (saved) {
      const data = JSON.parse(saved)
      return data[today]?.aiComment || ''
    }
    return ''
  })
  const [isAIReviewing, setIsAIReviewing] = useState(false)

  // 应用主题到 DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  // 每次 goals 改变时保存到 localStorage
  useEffect(() => {
    saveData(goals)
  }, [goals])

  // 请求通知权限
  const handleRequestNotification = useCallback(async () => {
    return await requestNotificationPermission()
  }, [])

  // 显示 Toast 提示
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }, [])

  // 切换主题
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // 增加全局 EXP
  const addExp = (amount) => {
    setGlobalExp(prev => {
      let newExp = prev + amount
      let newLevel = globalLevelRef.current
      
      // 升级检查
      while (newExp >= 100) {
        newExp -= 100
        newLevel += 1
      }
      
      // 保存到 localStorage
      localStorage.setItem('global_exp', newExp.toString())
      if (newLevel !== globalLevelRef.current) {
        localStorage.setItem('global_level', newLevel.toString())
        setGlobalLevel(newLevel)
        showToast(`🎉 升级了！Lv.${newLevel}`, 'success')
      }
      
      return newExp
    })
  }

  // 检查提醒时间并触发通知
  // 每分钟轮询一次，比对当前时间是否匹配设定的提醒时间
  useEffect(() => {
    const remindedToday = new Set()

    const checkReminders = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const currentTime = `${hours}:${minutes}`
      const todayStr = now.toISOString().split('T')[0]

      goals.forEach((goal) => {
        if (goal.reminderTime && goal.reminderTime === currentTime) {
          const remindKey = `${goal.id}-${todayStr}`

          if (goal.type === 'progress') {
            const todayProgress = goal.progressLog?.[todayStr] || 0
            const notCompleted = todayProgress < (goal.dailyTarget || 1)

            if (notCompleted && !remindedToday.has(remindKey)) {
              remindedToday.add(remindKey)
              if (Notification.permission === 'granted') {
                new Notification('田园计划提醒 🌱', {
                  body: `该做「${goal.name}」了，坚持就是胜利！`,
                  icon: '/icon.png'
                })
              } else {
                showToast(`🔔 该做「${goal.name}」了，坚持就是胜利！`, 'reminder')
              }
            }
          } else {
            if (!remindedToday.has(remindKey)) {
              remindedToday.add(remindKey)
              const notificationShown = showNotification(goal.name, '到了该推进目标的时间啦！')
              if (!notificationShown) {
                showToast(`🔔 ${goal.name}: 到了该推进目标的时间啦！`, 'reminder')
              }
            }
          }
        }
      })

      const savedReviewReminder = localStorage.getItem('garden_review_reminder')
      if (savedReviewReminder) {
        const { enabled, time } = JSON.parse(savedReviewReminder)
        if (enabled && time === currentTime) {
          const reviewKey = `review-${todayStr}`
          if (!remindedToday.has(reviewKey)) {
            remindedToday.add(reviewKey)
            if (Notification.permission === 'granted') {
              new Notification('田园计划 · 今日复盘 ✍️', {
                body: '今天完成得怎么样？花2分钟写下今天的收获吧',
                icon: '/icon.png'
              })
            } else {
              showToast('✍️ 今天完成得怎么样？花2分钟写下今天的收获吧', 'reminder')
            }
          }
        }
      }
    }

    checkReminders()

    const interval = setInterval(checkReminders, 60000)

    return () => clearInterval(interval)
  }, [goals])

  // PWA 安装提示事件监听
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  // 添加新目标
  const handleAddGoal = (type) => {
    setNewGoalName('')
    setNewGoalType(type)
    setNewHabitType('checkin')
    if (type === 'progress') {
      setNewGoalDailyTarget(30)
    }
    if (type === 'todo') {
      setNewGoalDueDate(todayStr)
    }
    setShowAddGoalModal(true)
    setShowFABPanel(false)
  }

  // 关闭新建弹窗
  const handleCloseAddGoalModal = () => {
    setShowAddGoalModal(false)
    setNewHabitType('checkin')
    setFabPreselectedType(null)
  }

  // 学期计划生成器
  const handleGeneratePlan = async () => {
    if (planGoals.length === 0) return
    setPlanGeneratorLoading(true)
    const today = new Date()
    const getDateStr = (days) => {
      const d = new Date(today)
      d.setDate(d.getDate() + days)
      return d.toISOString().split('T')[0]
    }
    try {
      const result = await callAI(
        '你是目标规划助手。根据用户情况生成一个聚焦的行动计划。detail 是行动要点，严格控制在10字以内，只写关键动作。只返回JSON不要其他文字。格式：{"goalName":"目标名称8字内","steps":[{"text":"步骤名8字以内","detail":"行动要点10字内","daysFromNow":14}]}',
        `我是${planIdentity || '学生'}，主要目标是${planGoals.join('和')}${planCustomGoal ? '（具体：' + planCustomGoal + '）' : ''}，距离目标还有${planTimeframe || '3个月'}。请生成一个4-5步的行动计划。`,
        'plan'
      )
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('no json')
      const parsed = JSON.parse(jsonMatch[0])
      const goalId = Date.now().toString()
      const steps = (parsed.steps || []).map((s, i) => ({
        id: Date.now().toString() + i,
        text: s.text || '步骤' + (i + 1),
        detail: s.detail || '',
        completed: false,
        scheduledDate: getDateStr(s.daysFromNow || (i + 1) * 14),
        createdAt: new Date().toISOString()
      }))
      const planNote = [planIdentity, planGoals.join('和'), planTimeframe].filter(Boolean).join(' · ')
      const newGoal = { id: goalId, name: parsed.goalName || planGoals[0], type: 'task', steps, note: planNote.length > 30 ? planNote.slice(0, 30) + '…' : planNote, completed: false, createdAt: today.toISOString() }
      setGoals(prev => [newGoal, ...prev])
      setShowGeneratePlanModal(false)
      setPlanGoals([])
      setPlanIdentity('')
      setPlanTimeframe('')
      if (typeof setPlanCustomGoal === 'function') setPlanCustomGoal('')
      setActiveTab('tasks')
      showToast('✅ 计划已生成，开始行动吧！', 'success')
    } catch (e) {
      showToast('生成失败，请重试', 'error')
    } finally {
      setPlanGeneratorLoading(false)
    }
  }

  // 快速拆解目标
  const handleQuickAIDecompose = async (goalName, timeframe, background) => {
    if (!goalName?.trim()) return
    const isExisting = !!pendingDecomposeGoalId
    const existingId = pendingDecomposeGoalId
    setShowQuickContext(false)
    setQuickTimeframe('')
    setQuickBackground('')
    setPendingDecomposeGoalId(null)
    const today = new Date()
    const getDateStr = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0] }
    const noteParts = [timeframe, background].filter(Boolean)
    const noteText = noteParts.join(' · ')
    const noteDisplay = noteText.length > 30 ? noteText.slice(0, 30) + '…' : noteText
    let goalId = existingId
    if (!isExisting) {
      goalId = Date.now().toString()
      setGoals(prev => [{ id: goalId, name: goalName, type: 'task', steps: [], note: noteDisplay, completed: false, createdAt: today.toISOString() }, ...prev])
      setActiveTab('tasks')
    }
    showToast('✨ AI 正在拆解步骤...', 'success')
    try {
      const ctx = [timeframe ? `距离目标${timeframe}` : '', background ? `背景：${background}` : ''].filter(Boolean).join('，')
      const result = await callAI(
        '你是目标拆解助手。根据用户目标和背景生成个性化计划。detail 是行动要点，严格控制在10字以内，只写关键动作。只返回JSON，格式：{"goalName":"个性化目标名10字内","steps":[{"text":"步骤名8字以内","detail":"行动要点10字内","daysFromNow":14}]}',
        `目标：${goalName}${ctx ? '。' + ctx : ''}`,
        'decompose'
      )
      const match = result.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('no json')
      const parsed = JSON.parse(match[0])
      const steps = (parsed.steps || []).map((s, i) => ({ id: Date.now().toString() + i, text: s.text || '步骤'+(i+1), detail: s.detail||'', completed: false, scheduledDate: getDateStr(s.daysFromNow||(i+1)*14), createdAt: new Date().toISOString() }))
      const finalName = isExisting ? goalName : (parsed.goalName?.trim() || goalName)
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, name: finalName, steps, note: noteDisplay } : g))
      showToast('✅ 步骤已生成，开始行动吧！', 'success')
    } catch(e) {
      showToast('AI 拆解失败，请重试', 'error')
    }
  }

  // 获取本周日期范围
  const getWeekRange = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // 周日为7
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + 1)
    return {
      start: getLocalDateStr(monday),
      end: getLocalDateStr(today),
      daysRemaining: 7 - dayOfWeek
    }
  }

  // 判断日期是否在本周内
  const isThisWeek = (dateStr) => {
    const { start, end } = getWeekRange()
    return dateStr >= start && dateStr <= end
  }

  // 收集本周数据
  const collectWeeklyData = () => {
    const today = new Date()
    const weekDay = today.getDay() || 7 // 周日为7
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    // 统计完成步骤数
    let completedSteps = 0
    goals.forEach(goal => {
      if (goal.type === 'task' && goal.steps) {
        goal.steps.forEach(step => {
          if (step.completed && step.scheduledDate && isThisWeek(step.scheduledDate)) {
            completedSteps++
          }
        })
      }
    })

    // 统计习惯打卡次数
    let habitCheckins = 0
    const habitCount = goals.filter(g => g.type === 'progress').length
    const lowCheckinHabits = []
    
    goals.forEach(goal => {
      if (goal.type === 'progress' && goal.progressLog) {
        let checkinDays = 0
        Object.keys(goal.progressLog).forEach(date => {
          if (isThisWeek(date)) {
            checkinDays++
            habitCheckins++
          }
        })
        // 检查是否打卡率低（本周打卡少于3天）
        if (checkinDays > 0 && checkinDays < 3) {
          lowCheckinHabits.push({ name: goal.name, days: checkinDays })
        }
      }
    })

    // 统计待办完成数
    let completedTodos = 0
    goals.forEach(goal => {
      if (goal.type === 'todo' && goal.completed && goal.dueDate && isThisWeek(goal.dueDate)) {
        completedTodos++
      }
    })

    return {
      completedSteps,
      habitCheckins,
      habitCount,
      lowCheckinHabits,
      completedTodos,
      weekDay: weekDays[weekDay - 1],
      daysRemaining: 7 - weekDay
    }
  }

  // 每周AI洞察刷新
  const handleRefreshWeeklyInsight = async () => {
    setWeeklyInsightLoading(true)

    try {
      const weeklyData = collectWeeklyData()
      
      let lowCheckinText = ''
      if (weeklyData.lowCheckinHabits.length > 0) {
        lowCheckinText = weeklyData.lowCheckinHabits.map(h => `${h.name}：本周只打卡了${h.days}天`).join('；')
      }

      const userMessage = `本周数据：
完成目标步骤${weeklyData.completedSteps}个
习惯打卡${weeklyData.habitCheckins}次（共${weeklyData.habitCount}个习惯）
${lowCheckinText}
完成待办${weeklyData.completedTodos}件
今天是星期${weeklyData.weekDay}，本周还剩${weeklyData.daysRemaining}天`

      const systemPrompt = `你是一个数据分析型效率教练。
根据用户本周的真实行为数据，
给出3条具体洞察，每条不超过30字。
严格返回 JSON：
{ "insights": ["洞察1", "洞察2", "洞察3"] }
洞察要基于数据事实，不要废话和鸡汤。
如果数据很少，诚实说明并给出一条建议。`

      const result = await callAI(systemPrompt, userMessage, 'weekly')

      let insightData
      try {
        insightData = JSON.parse(result)
      } catch {
        throw new Error('JSON解析失败')
      }

      const saveData = {
        date: getLocalDateStr(),
        insights: insightData.insights || ['暂无洞察']
      }
      
      localStorage.setItem('garden_weekly_insight', JSON.stringify(saveData))
      setWeeklyInsightData(saveData)
      showToast('✅ 本周洞察已更新', 'success')
    } catch (error) {
      console.error('生成洞察失败:', error)
      showToast(error.message || '生成失败，请重试', 'error')
    } finally {
      setWeeklyInsightLoading(false)
      // 防止 FocusTimer 状态残留
      if (!isFocusActive) setSelectedStep(null)
    }
  }

  // 格式化洞察时间
  const formatWeeklyInsightTime = (dateStr) => {
    const savedDate = new Date(dateStr)
    const today = new Date()
    const todayStr = getLocalDateStr()
    
    if (dateStr === todayStr) {
      return `今天 ${savedDate.getHours().toString().padStart(2, '0')}:${savedDate.getMinutes().toString().padStart(2, '0')}`
    } else {
      return `${savedDate.getMonth() + 1}月${savedDate.getDate()}日`
    }
  }

  // 组件挂载时检查是否需要自动生成（周日）
  useEffect(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0为周日
    const savedData = localStorage.getItem('garden_weekly_insight')
    
    if (dayOfWeek === 0 && (!savedData || JSON.parse(savedData).date !== getLocalDateStr())) {
      handleRefreshWeeklyInsight()
    }
  }, [])

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/EdgA|OPR|SamsungBrowser/i.test(navigator.userAgent)
    const isSamsung = /SamsungBrowser/i.test(navigator.userAgent)
    const dismissed = localStorage.getItem('chrome_tip_dismissed')
    if (isAndroid && !isChrome && !isSamsung && !dismissed) {
      setTimeout(() => {
        showToast('💡 建议用 Chrome 打开，可安装到桌面使用', 'info')
        localStorage.setItem('chrome_tip_dismissed', 'true')
      }, 2000)
    }
  }, [])

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isInstalled) return
    const dismissed = localStorage.getItem('install_banner_dismissed')
    if (dismissed) return
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    setTimeout(() => {
      setShowInstallBanner(true)
    }, 4000)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    setShowInstallBanner(false)
    localStorage.setItem('install_banner_dismissed', 'true')
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('install_banner_dismissed', 'true')
  }

  const handleOpenFAB = () => {
    setShowFABPanel(!showFABPanel)
  }

  const handleFABSelect = (type) => {
    setShowFABPanel(false)
    setFabPreselectedType(type)
    handleAddGoal(type)
  }

  const handleConfirmAddGoal = () => {
    if (!newGoalName.trim()) {
      showToast('请输入目标名称', 'error')
      return
    }

    const goalData = createNewGoal(newGoalName, newGoalType, newGoalDailyTarget, newGoalDueDate, newHabitType)
    
    // 待办类型自动安排到今天
    if (newGoalType === 'todo' && !newGoalDueDate) {
      goalData.dueDate = getLocalDateStr()
    }

    setGoals((prev) => [goalData, ...prev])
    setShowAddGoalModal(false)
    setNewGoalName('')
    setActiveTab('tasks')
    setTaskFilter(newGoalType === 'todo' ? 'todo' : newGoalType === 'progress' ? 'progress' : 'task')
    showToast('✅ 已创建', 'success')

    // 防止 FocusTimer 状态残留
    if (!isFocusActive) setSelectedStep(null)
  }

  // 删除目标
  const handleDeleteGoal = (goalId) => {
    showConfirm('确定要删除这个目标吗？', () => {
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
    })
  }

  // 更新目标（通过 updater 函数）
  // 使用暴力深拷贝机制确保状态更新
  const handleUpdateGoal = (goalId, updater) => {
    setGoals((prev) => {
      // 暴力深拷贝整个数组，确保引用完全更新
      const newGoals = JSON.parse(JSON.stringify(prev))
      return newGoals.map((g) => 
        g.id === goalId ? (typeof updater === 'function' ? updater(g) : updater) : g
      )
    })
  }

  // 打开记录进度弹窗
  const handleOpenRecordModal = (goal) => {
    const today = getLocalDateStr()
    setCurrentGoalForRecord(goal)
    setRecordValue(goal.progressLog[today] || 0)
    setShowRecordModal(true)
  }

  // 关闭记录进度弹窗
  const handleCloseRecordModal = () => {
    setShowRecordModal(false)
    setCurrentGoalForRecord(null)
    setRecordValue(0)
  }

  // 打开任务时间安排 BottomSheet
  const handleOpenTimeSheet = (task, type) => {
    setTimeSheetTask(task)
    setTimeSheetType(type)
    setShowTimePicker(false)
    setShowTimeSheet(true)
  }

  // 关闭任务时间安排 BottomSheet
  const handleCloseTimeSheet = () => {
    setShowTimeSheet(false)
    setTimeSheetTask(null)
    setTimeSheetType(null)
    setShowTimePicker(false)
  }

  // 更新任务时间安排
  const handleUpdateTaskTime = (scheduledTime, scheduledEndTime) => {
    if (!timeSheetTask || !timeSheetType) return

    if (timeSheetType === 'todo') {
      handleUpdateGoal(timeSheetTask.id, (g) => ({
        ...g,
        scheduledTime,
        scheduledEndTime
      }))
    } else if (timeSheetType === 'task') {
      handleUpdateGoal(timeSheetTask.goalId, (g) => ({
        ...g,
        steps: g.steps.map(s =>
          s.id === timeSheetTask.id
            ? { ...s, scheduledTime, scheduledEndTime }
            : s
        )
      }))
    } else if (timeSheetType === 'progress') {
      handleUpdateGoal(timeSheetTask.id, (g) => ({
        ...g,
        scheduledTime,
        scheduledEndTime
      }))
    }

    setShowTimePicker(false)
  }

  // 保存日复盘
  const handleSaveDailyReview = () => {
    const today = getLocalDateStr()
    const saved = localStorage.getItem('goal_daily_review')
    const data = saved ? JSON.parse(saved) : {}
    
    data[today] = {
      ...data[today],
      text: dailyReviewText
    }
    
    localStorage.setItem('goal_daily_review', JSON.stringify(data))
  }

  // AI 点评日复盘

  const handleSaveShareCard = () => {
    const col = loadPlantCollection()
    const totalSteps = goals.flatMap(g => g.steps || []).filter(s => s.completed).length
    const done = goals.filter(g => g.completed).length
    const canvas = buildShareCanvas(col, globalLevel, totalSteps, done, gardenNickname)
    canvas.toBlob(async (blob) => {
      const file = new File([blob], '田园计划.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: gardenNickname ? `${gardenNickname}的田园` : '我的田园', text: `我在田园计划收获了${col.length}种作物！` })
          return
        } catch (e) { /* 用户取消或不支持，走下载 */ }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = '田园计划.png'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 3000)
    }, 'image/png')
  }

  const handleAIReview = async () => {
    setIsAIReviewing(true)
    try {
      const today = getLocalDateStr()

      const completedTodaySteps = goals
        .flatMap(g => g.steps || [])
        .filter(s => s.completed && s.scheduledDate === today)
        .map(s => s.text)

      const completedHabits = goals
        .filter(g => g.type === 'progress')
        .filter(g => {
          const log = g.progressLog?.[today] || 0
          return g.habitType === 'checkin' ? log >= 1 : log >= (g.dailyTarget || 1)
        })
        .map(g => g.name)

      const activeGoals = goals
        .filter(g => g.type === 'task' && !g.completed)
        .map(g => `${g.name}（${g.steps.filter(s => s.completed).length}/${g.steps.length}步）`)

      const autoSummary = [
        completedTodaySteps.length > 0 ? `今日完成步骤：${completedTodaySteps.join('、')}` : '今日暂无完成步骤',
        completedHabits.length > 0 ? `已打卡习惯：${completedHabits.join('、')}` : '今日习惯暂未打卡',
        activeGoals.length > 0 ? `进行中目标：${activeGoals.join('；')}` : '',
        dailyReviewText.trim() ? `用户备注：${dailyReviewText.trim()}` : ''
      ].filter(Boolean).join('\n')

      const comment = await callAI(
        '你是效率教练。根据用户今日真实数据给出三句点评：①肯定一个具体行为②指出最需改进的一点给出可执行建议③"明天建议：[具体动作]"。总字数不超过80字，不说废话。',
        autoSummary,
        'weekly'
      )

      if (!comment) throw new Error('未获取到有效响应')
      setAiComment(comment)

      const saved = localStorage.getItem('goal_daily_review')
      const reviewData = saved ? JSON.parse(saved) : {}
      reviewData[today] = { ...reviewData[today], text: dailyReviewText, aiComment: comment }
      localStorage.setItem('goal_daily_review', JSON.stringify(reviewData))

    } catch (error) {
      console.error('AI 点评失败:', error)
      showToast(`点评失败: ${error.message}`, 'error')
    } finally {
      setIsAIReviewing(false)
      if (!isFocusActive) setSelectedStep(null)
    }
  }

  // 快捷增加
  const handleQuickAdd = (delta) => {
    setRecordValue((prev) => Math.max(0, prev + delta))
  }

  // 打卡型习惯打卡
  const handleCheckinHabit = (goalId) => {
    const today = getLocalDateStr()
    setGoals((prev) => prev.map((g) => {
      if (g.id !== goalId) return g
      const currentProgress = g.progressLog[today] || 0
      const isAlreadyCheckedIn = currentProgress >= 1
      return {
        ...g,
        progressLog: {
          ...g.progressLog,
          [today]: isAlreadyCheckedIn ? 0 : 1
        }
      }
    }))
  }

  // 确认记录进度
  const handleConfirmRecord = () => {
    if (!currentGoalForRecord) return
    
    const today = getLocalDateStr()
    const previousProgress = currentGoalForRecord.progressLog[today] || 0
    const dailyTarget = currentGoalForRecord.dailyTarget || 0
    
    // 计算当前目标的统计数据（用于检测是否需要扣除挽救次数）
    const statsBefore = computeProgressStats(currentGoalForRecord, coachStyle)
    const stageBefore = statsBefore.plantStage
    
    // 更新进度
    handleUpdateGoal(currentGoalForRecord.id, (g) => ({
      ...g,
      progressLog: {
        ...g.progressLog,
        [today]: recordValue
      }
    }))
    
    // 每完成一次推进型打卡 +5 EXP
    addExp(5)
    
    // 判断是否首次达到目标
    const wasBelowTarget = previousProgress < dailyTarget
    const isNowAtOrAboveTarget = recordValue >= dailyTarget && dailyTarget > 0
    
    if (wasBelowTarget && isNowAtOrAboveTarget) {
      // 首次达到目标，触发撒花
      fireConfetti()
      
      // 检测是否需要扣除挽救次数
      if (statsBefore.canRescue && statsBefore.currentStreak === 0) {
        // 从挽救日志中扣除一次
        const rescueLog = loadRescueLog()
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        
        if (!rescueLog[currentGoalForRecord.id]) {
          rescueLog[currentGoalForRecord.id] = {}
        }
        rescueLog[currentGoalForRecord.id][currentMonth] = (rescueLog[currentGoalForRecord.id][currentMonth] || 0) + 1
        
        saveRescueLog(rescueLog)
        showToast('✨ 连续记录已挽救！', 'success')
      } else {
        showToast('🎉 今日目标已达成！', 'success')
      }
      
      // 记录活动（热力图）
      recordActivity(today)
      
      // 检测植物阶段是否提升
      const tempGoal = {
        ...currentGoalForRecord,
        progressLog: {
          ...currentGoalForRecord.progressLog,
          [today]: recordValue
        }
      }
      const statsAfter = computeProgressStats(tempGoal, coachStyle)
      const stageAfter = statsAfter.plantStage
      
      if (stageAfter > stageBefore) {
        // 植物升级了！
        setTimeout(() => {
          fireConfetti({ particleCount: 180, spread: 90 })
        }, 300)
        
        const stageNames = ['种子', '发芽', '幼苗', '小树', '大树', '结果']
        showToast(`🌱 你的小树长大了！现在是「${stageNames[stageAfter]}」`, 'success')
        
        // 触发卡片上的植物弹跳动画
        const plantCard = document.querySelector(`.today-card[data-goal-id="${currentGoalForRecord.id}"] .plant-visual`)
        if (plantCard) {
          plantCard.classList.add('plant-bounce')
          setTimeout(() => plantCard.classList.remove('plant-bounce'), 800)
        }
      }
    }
    
    handleCloseRecordModal()
  }

  // 添加步骤
  const handleAddStep = (goalId, text) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, steps: [...g.steps, { id: generateId(), text, completed: false }] }
          : g
      )
    )
  }

  // 导出数据
  const handleExportData = () => {
    const keysToExport = [
      'goal_promoter_data',
      'goal_promoter_activity',
      'goal_promoter_theme',
      'goal_pusher_coach_style'
    ]
    
    const backup = {}
    keysToExport.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          backup[key] = JSON.parse(value)
        } catch {
          backup[key] = value
        }
      }
    })

    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const filename = `little-goals-backup-${dateStr}.json`

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('✅ 数据导出成功', 'success')
  }

  // 导入数据
  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)

          // 格式校验
          const requiredKeys = ['goal_promoter_data']
          const isValid = requiredKeys.some(key => Object.keys(data).includes(key))
          if (!isValid) {
            throw new Error('无效的数据格式')
          }

          showConfirm('此操作将覆盖当前所有本地数据，确定吗？', () => {
            // 写入数据
            Object.keys(data).forEach(key => {
              localStorage.setItem(key, JSON.stringify(data[key]))
            })

            showToast('✅ 数据导入成功，即将刷新页面', 'success')
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          })
        } catch (error) {
          showToast(`❌ 导入失败: ${error.message}`, 'error')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // AI 目标拆解
  const handleAIDecompose = async (goalId, context = {}) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, isDecomposing: true } : g
      )
    )

    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const coachStyle = loadCoachStyle()
      const styleConfig = COACH_STYLES[coachStyle]
      const today = getLocalDateStr()

      const systemPrompt = styleConfig.decomposePrompt +
        `\n今天的日期是：${today}。

【输出格式】严格返回 JSON 数组，每个元素包含三个字段：
- title：步骤标题，必须是完整短句，不超过10个汉字，禁止用逗号截断，禁止省略号结尾
- detail：30字以内的一句话说明，必须填写，不能为空
- suggestedDate：格式 YYYY-MM-DD

【标题示例——严格按此风格】
✅ 正确："制定复习计划" "背诵第一单元" "完成模拟测试"
❌ 错误："梳理本学期课程表，" "每周日晚上规划下周" "进行一次学习复盘与"

【输出示例】
[
  {"title":"制定复习计划","detail":"列出各科优先级和每日时间分配","suggestedDate":"2025-05-20"},
  {"title":"背诵第一单元","detail":"用间隔重复法，每天30分钟","suggestedDate":"2025-05-25"}
]

只返回纯 JSON 数组，不要任何说明文字、不要代码块标记。`

      const contextStr = context.weeks || context.hours
        ? `\n完成期限：${context.weeks || '不限'}；每天可投入时间：${context.hours || '不限'}`
        : ''
      const content = await callAI(
        systemPrompt,
        `目标：${goal.name}${contextStr}`,
        'decompose'
      )

      let steps = []
      try {
        const cleaned = cleanJSON(content)
        const parsed = JSON.parse(cleaned)
        if (!Array.isArray(parsed)) throw new Error('not array')
        steps = parsed.map(item => ({
          id: generateId(),
          text: (() => { const t = typeof item === 'string' ? item : (item.title || item.text || ''); return t.length > 8 ? t.slice(0, 8) : t })(),
          detail: typeof item === 'object' ? (item.detail || '') : '',
          completed: false,
          scheduledDate: typeof item === 'object' ? (item.suggestedDate || null) : null
        }))
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Content:', content)
        showToast('AI 返回格式异常，请重试', 'error')
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId ? { ...g, isDecomposing: false } : g
          )
        )
        return
      }

      if (steps.length === 0) {
        throw new Error('响应不是有效的步骤数组')
      }

      const updatedGoal = { ...goal, isDecomposing: false, steps: [...(goal.steps || []), ...steps] }
      handleUpdateGoal(goalId, updatedGoal)
      showToast(`✨ 已拆解 ${steps.length} 步`, 'success')

    } catch (error) {
      console.error('Decompose error:', error)
      showToast(error.message || 'AI 拆解失败，请重试', 'error')
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, isDecomposing: false } : g
        )
      )
    } finally {
      // 防止 FocusTimer 状态残留
      if (!isFocusActive) setSelectedStep(null)
    }
  }

  // AI 复盘教练
  const handleCoachReview = async (goalId) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, isCoachReviewing: true } : g
      )
    )

    try {
      const goal = goals.find((g) => g.id === goalId)
      if (!goal) throw new Error('目标不存在')

      const userMessage = `
目标名称：${goal.name}
已完成步骤：${goal.steps.filter(s => s.completed).map(s => s.text).join('、') || '暂无'}
未完成步骤：${goal.steps.filter(s => !s.completed).map(s => s.text).join('、') || '暂无'}
用户复盘笔记：${goal.notes || '（无）'}
`

      const feedback = await callAI(
        COACH_STYLES[coachStyle].reviewPrompt + `\n\n请基于以上客观数据进行点评，不要说"根据你提供的信息"这种废话。
输出严格按三段：
①一句话肯定一个具体行为
②一句话指出最需要改进的地方，给出可执行建议
③"建议下一步：[具体行动]"

每段不超过50字，语气犀利有力，不说废话。`,
        userMessage,
        'coach'
      )

      if (!feedback) {
        throw new Error('未获取到有效的响应内容')
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, isCoachReviewing: false, coachFeedback: feedback.trim() }
            : g
        )
      )
    } catch (error) {
      console.error('教练审视失败:', error)
      showToast(error.message || '审视失败，请重试', 'error')
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, isCoachReviewing: false } : g
        )
      )
    } finally {
      // 防止 FocusTimer 状态残留
      if (!isFocusActive) setSelectedStep(null)
    }
  }

  // 切换步骤完成状态
  const handleToggleStep = (goalId, stepId) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g
        const newSteps = g.steps.map((s) => {
          if (s.id === stepId && !s.completed) {
            recordActivity()
            const creditedSteps = loadCreditedSteps()
            const isFirstTime = !creditedSteps.has(stepId)
            if (isFirstTime) {
              creditedSteps.add(stepId)
              saveCreditedSteps(creditedSteps)
              addCappedStep()
              addExp(20)
              const currentCoach = loadCoachStyle()
              const coachMsgs = COACH_TOAST_MESSAGES[currentCoach] || COACH_TOAST_MESSAGES.gentle
              const coachMsg = coachMsgs[Math.floor(Math.random() * coachMsgs.length)]
              showToast(coachMsg, 'plant')

                  setTimeout(() => {
                    const collection = loadPlantCollection()
                    const unlockedIds = collection.map(p => p.id)
                    const totalCapped = getTotalCappedSteps()
                    const activity = loadActivity()
                    const maxStreak = Math.max(...Object.values(
                      (() => {
                        const dates = Object.keys(activity).sort()
                        let max = 0, cur = 0
                        for (let i = 0; i < dates.length; i++) {
                          if (i === 0 || daysBetween(dates[i-1], dates[i]) > 1) cur = 1
                          else cur++
                          if (cur > max) max = cur
                        }
                        return { max }
                      })()
                    ), 0)

                    const cappedData = loadCappedSteps()
                    const maxDaySteps = Object.values(cappedData).length > 0
                      ? Math.max(...Object.values(cappedData))
                      : 0
                    const stats = {
                      totalSteps: goals.flatMap(g => g.steps || []).filter(s => s.completed).length,
                      cappedSteps: totalCapped,
                      maxStreak,
                      maxDaySteps,
                      completedGoals: goals.filter(g => g.completed).length,
                      activeGoals: goals.filter(g => g.type === 'task' && !g.completed).length,
                      hasRescued: false
                    }

                    PLANT_ACHIEVEMENTS.forEach(achievement => {
                      if (!unlockedIds.includes(achievement.id) && achievement.condition(stats)) {
                        const newCollection = [...collection, {
                          id: achievement.id,
                          name: achievement.name,
                          emoji: achievement.emoji,
                          unlockedAt: getLocalDateStr()
                        }]
                        savePlantCollection(newCollection)
                        setTimeout(() => {
                          showToast(`🎊 新植物解锁！\n${achievement.emoji} ${achievement.name} · ${achievement.desc}`, 'unlock')
                          import('canvas-confetti').then(m => m.default({ particleCount: 80, spread: 60, origin: { y: 0.7 }, zIndex: 9999 }))
                        }, 800)
                      }
                    })
                  }, 300)

              try {
                import('canvas-confetti').then((m) => {
                  m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 });
                });
              } catch (err) {}
            }
          }
          return s.id === stepId ? { ...s, completed: !s.completed } : s
        })
        const allCompleted = newSteps.length > 0 && newSteps.every(s => s.completed)
        return {
          ...g,
          steps: newSteps,
          completed: newSteps.length > 0 ? allCompleted : g.completed,
        }
      })
    )
  }

  // 删除步骤
  const handleDeleteStep = (goalId, stepId) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, steps: g.steps.filter((s) => s.id !== stepId) } : g
      )
    )
  }

  // 选中步骤打开计时器（添加安全检查）
  const handleSelectStep = useCallback((step) => {
    // 安全检查：确保 step 有有效数据
    if (!step || !step.id || !step.text) {
      return
    }

    setSelectedStep(step)
    setIsFocusActive(true)
  }, [])

  // 关闭计时器
  const handleCloseTimer = useCallback(() => {
    setIsFocusActive(false)
    setSelectedStep(null)
  }, [])

  // 习惯专注完成后的处理
  const handleHabitComplete = useCallback((step) => {
    if (!step.isHabit || !step.goalId) return

    const goal = goals.find(g => g.id === step.goalId)
    if (!goal) return

    const today = getLocalDateStr()

    if (step.habitType === 'checkin') {
      // 打卡型习惯：自动打卡
      handleCheckinHabit(step.goalId)
      showToast('✅ 习惯已完成！', 'success')
    } else {
      // 计数型习惯：打开记录弹窗
      handleOpenRecordModal(goal)
    }
  }, [goals, handleCheckinHabit, handleOpenRecordModal, showToast])

  return (
    <div className="app">
      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-banner-left">
            <span className="install-banner-icon">🌱</span>
            <div>
              {deferredPrompt ? (
                <>
                  <p className="install-banner-title">安装到桌面</p>
                  <p className="install-banner-desc">像 App 一样随时打开</p>
                </>
              ) : (
                <>
                  <p className="install-banner-title">添加到主屏幕</p>
                  <p className="install-banner-desc">{/iPhone|iPad/i.test(navigator.userAgent) ? '点击底部分享按钮 → 添加到主屏幕' : '浏览器菜单 → 添加到主屏幕'}</p>
                </>
              )}
            </div>
          </div>
          <div className="install-banner-actions">
            {deferredPrompt && (
              <button className="install-banner-btn" onClick={handleInstall}>安装</button>
            )}
            <button className="install-banner-close" onClick={handleDismissInstall}>×</button>
          </div>
        </div>
      )}
      <header className={`app-header ${activeTab !== "calendar" ? "app-header-hidden" : ""}`}>
        <div className="app-brand">
          <span className="app-brand-dot" />
          <div className="app-brand-text">
            <span className="app-brand-name">田园计划</span>
            <span className="app-brand-sub">认真完成，才算数</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ===== 日历 Tab ===== */}
        {activeTab === 'calendar' && (
          <div className="calendar-section">
            {/* A. 顶部视图切换栏 */}
            <div className="calendar-view-tabs">
              <button
                className={`calendar-view-tab ${calendarView === 'week' ? 'active' : ''}`}
                onClick={() => setCalendarView('week')}
              >
                周
              </button>
              <button
                className={`calendar-view-tab ${calendarView === 'day' ? 'active' : ''}`}
                onClick={() => setCalendarView('day')}
              >
                日
              </button>
              <button
                className={`calendar-view-tab ${calendarView === 'month' ? 'active' : ''}`}
                onClick={() => setCalendarView('month')}
              >
                月
              </button>
            </div>

            {/* B. 周视图 */}
            {calendarView === 'week' && (
              <>
                <div className="calendar-nav">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      const current = new Date(currentWeekStart)
                      current.setDate(current.getDate() - 7)
                      setCurrentWeekStart(getLocalDateStr(current))
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="calendar-nav-title">
                    {(() => {
                      const weekDays = getWeekDays(currentWeekStart)
                      const weekStart = new Date(weekDays[0])
                      const weekEnd = new Date(weekDays[6])
                      const startMonth = weekStart.getMonth() + 1
                      const endMonth = weekEnd.getMonth() + 1
                      const startDay = weekStart.getDate()
                      const endDay = weekEnd.getDate()
                      return startMonth === endMonth
                        ? `${startMonth}月${startDay} - ${endDay}日`
                        : `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`
                    })()}
                  </span>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      const current = new Date(currentWeekStart)
                      current.setDate(current.getDate() + 7)
                      setCurrentWeekStart(getLocalDateStr(current))
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="calendar-week-grid">
                  {getWeekDays(currentWeekStart).map((dateStr) => {
                    const { month, day, weekday } = formatDateLabel(dateStr)
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate

                    const todosOnDate = goals.filter(g =>
                      g.type === 'todo' && !g.completed && g.dueDate === dateStr
                    )
                    const stepsOnDate = goals
                      .filter(g => g.type === 'task')
                      .flatMap(g => g.steps
                        .filter(s => s.scheduledDate === dateStr && !s.completed)
                        .map(s => ({ ...s, goalName: g.name, goalId: g.id }))
                      )
                    const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(dateStr))

                    const allItems = [
                      ...todosOnDate.map(t => ({ type: 'todo', item: t })),
                      ...stepsOnDate.map(s => ({ type: 'task', item: s })),
                      ...habitsOnDate.map(h => ({ type: 'progress', item: h }))
                    ]

                    const colorDots = allItems.slice(0, 3).map(({ type, item }) => ({
                      color: TASK_COLORS[type],
                      hasTime: !!(item.scheduledTime)
                    }))
                    const extraCount = allItems.length > 3 ? allItems.length - 3 : 0

                    return (
                      <div
                        key={dateStr}
                        className={`calendar-week-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <div className="calendar-weekday-label">{weekday}</div>
                        <div className={`calendar-date-number ${isToday ? 'today' : ''}`}>
                          {day}
                        </div>
                        <div className="calendar-color-dots">
                          {colorDots.map((dot, idx) => (
                            extraCount > 0 && idx === 2 ? (
                              <span key={idx} className="calendar-dot-extra">+{extraCount}</span>
                            ) : (
                              <span
                                key={idx}
                                className={`calendar-dot ${dot.hasTime ? '' : 'hollow'}`}
                                style={dot.hasTime ? { background: dot.color } : { borderColor: dot.color }}
                              />
                            )
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* C. 日视图 */}
            {calendarView === 'day' && (
              <>
                <div className="calendar-nav">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      const current = new Date(selectedDate)
                      current.setDate(current.getDate() - 1)
                      setSelectedDate(getLocalDateStr(current))
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="calendar-nav-title">
                    {formatDateLabel(selectedDate).full}
                  </span>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      const current = new Date(selectedDate)
                      current.setDate(current.getDate() + 1)
                      setSelectedDate(getLocalDateStr(current))
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="calendar-day-timeline">
                  {(() => {
                    const todosOnDate = goals.filter(g =>
                      g.type === 'todo' && !g.completed && g.dueDate === selectedDate
                    )
                    const stepsOnDate = goals
                      .filter(g => g.type === 'task')
                      .flatMap(g => g.steps
                        .filter(s => s.scheduledDate === selectedDate && !s.completed)
                        .map(s => ({ ...s, goalName: g.name, goalId: g.id }))
                      )
                    const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(selectedDate))

                    const scheduledItems = [
                      ...todosOnDate.filter(t => t.scheduledTime).map(t => ({
                        type: 'todo',
                        item: t,
                        time: t.scheduledTime
                      })),
                      ...stepsOnDate.filter(s => s.scheduledTime).map(s => ({
                        type: 'task',
                        item: s,
                        time: s.scheduledTime
                      })),
                      ...habitsOnDate.filter(h => h.scheduledTime).map(h => ({
                        type: 'progress',
                        item: h,
                        time: h.scheduledTime
                      }))
                    ].sort((a, b) => a.time.localeCompare(b.time))

                    const unscheduledItems = [
                      ...todosOnDate.filter(t => !t.scheduledTime).map(t => ({ type: 'todo', item: t })),
                      ...stepsOnDate.filter(s => !s.scheduledTime).map(s => ({ type: 'task', item: s })),
                      ...habitsOnDate.filter(h => !h.scheduledTime).map(h => ({ type: 'progress', item: h }))
                    ]

                    const hours = []
                    for (let h = 6; h <= 23; h++) {
                      hours.push(`${h.toString().padStart(2, '0')}:00`)
                    }

                    return (
                      <>
                        {unscheduledItems.length > 0 && (
                          <div className="calendar-unscheduled">
                            <div className="calendar-unscheduled-label">未安排</div>
                            <div className="calendar-unscheduled-items">
                              {unscheduledItems.map(({ type, item }) => (
                                <div
                                  key={item.id}
                                  className="calendar-task-block"
                                  style={{
                                    borderLeftColor: TASK_COLORS[type],
                                    background: `${TASK_COLORS[type]}10`
                                  }}
                                  onClick={() => handleOpenTimeSheet(item, type)}
                                >
                                  <span className="calendar-task-name">{item.name || item.text}</span>
                                  <span className="calendar-task-schedule-btn">+ 安排时间</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="calendar-timeline">
                          {hours.map((hour) => {
                            const itemsAtHour = scheduledItems.filter(
                              ({ time }) => time && time.startsWith(hour.split(':')[0])
                            )
                            return (
                              <div key={hour} className="calendar-timeline-row">
                                <div className="calendar-timeline-time">{hour}</div>
                                <div className="calendar-timeline-content">
                                  {itemsAtHour.map(({ type, item, time }) => {
                                    const startHour = parseInt(time.split(':')[0])
                                    const endTime = item.scheduledEndTime || `${String(startHour + 1).padStart(2, '0')}:00`
                                    const endHour = parseInt(endTime.split(':')[0])
                                    const durationHours = endHour - startHour
                                    const height = Math.max(40, durationHours * 64)
                                    return (
                                      <div
                                        key={item.id}
                                        className="calendar-task-block scheduled"
                                        style={{
                                          borderLeftColor: TASK_COLORS[type],
                                          background: `${TASK_COLORS[type]}14`,
                                          height: `${height}px`,
                                          minHeight: '40px'
                                        }}
                                        onClick={() => handleOpenTimeSheet(item, type)}
                                      >
                                        <span className="calendar-task-name">{item.name || item.text}</span>
                                        <span className="calendar-task-time">{time} - {endTime}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </>
            )}

            {/* D. 月视图 */}
            {calendarView === 'month' && (
              <>
                <div className="calendar-nav">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      setCurrentMonth(prev => {
                        if (prev.month === 0) {
                          return { year: prev.year - 1, month: 11 }
                        }
                        return { ...prev, month: prev.month - 1 }
                      })
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="calendar-nav-title">
                    {currentMonth.year}年{currentMonth.month + 1}月
                  </span>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      setCurrentMonth(prev => {
                        if (prev.month === 11) {
                          return { year: prev.year + 1, month: 0 }
                        }
                        return { ...prev, month: prev.month + 1 }
                      })
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="calendar-month-grid">
                  <div className="calendar-month-header">
                    {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                      <div key={d} className="calendar-month-header-cell">{d}</div>
                    ))}
                  </div>
                  <div className="calendar-month-body">
                    {getMonthDays(currentMonth.year, currentMonth.month).map((dateStr, idx) => {
                      if (!dateStr) {
                        return <div key={idx} className="calendar-month-cell empty" />
                      }

                      const { day } = formatDateLabel(dateStr)
                      const isToday = dateStr === todayStr
                      const isSelected = dateStr === selectedDate

                      const todosOnDate = goals.filter(g =>
                        g.type === 'todo' && !g.completed && g.dueDate === dateStr
                      )
                      const stepsOnDate = goals
                        .filter(g => g.type === 'task')
                        .flatMap(g => g.steps
                          .filter(s => s.scheduledDate === dateStr && !s.completed)
                        )
                      const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(dateStr))

                      const allItems = [
                        ...todosOnDate.map(t => ({ type: 'todo' })),
                        ...stepsOnDate.map(s => ({ type: 'task' })),
                        ...habitsOnDate.map(h => ({ type: 'progress' }))
                      ]

                      const colorDots = allItems.slice(0, 3).map(({ type }) => TASK_COLORS[type])
                      const extraCount = allItems.length > 3 ? allItems.length - 3 : 0

                      return (
                        <div
                          key={idx}
                          className={`calendar-month-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedDate(dateStr)
                            setCalendarView('week')
                          }}
                        >
                          <div className={`calendar-month-date ${isToday ? 'today' : ''}`}>{day}</div>
                          <div className="calendar-month-dots">
                            {colorDots.map((color, idx) => (
                              extraCount > 0 && idx === 2 ? (
                                <span key={idx} className="calendar-dot-extra">+{extraCount}</span>
                              ) : (
                                <span
                                  key={idx}
                                  className="calendar-dot"
                                  style={{ background: color }}
                                />
                              )
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* E. 选中日期任务展开区 */}
            {(calendarView === 'week' || calendarView === 'month') && (
              <div className="calendar-task-panel">
                {(() => {
                  const { month, day } = formatDateLabel(selectedDate)

                  const todosOnDate = goals.filter(g =>
                    g.type === 'todo' && !g.completed &&
                    (g.dueDate === null || g.dueDate === undefined || g.dueDate === selectedDate)
                  )
                  const stepsOnDate = goals
                    .filter(g => g.type === 'task')
                    .flatMap(g => g.steps
                      .filter(s => s.scheduledDate === selectedDate && !s.completed)
                      .map(s => ({ ...s, goalName: g.name, goalId: g.id }))
                    )
                  const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(selectedDate || todayStr))

                  const totalCount = todosOnDate.length + stepsOnDate.length + habitsOnDate.length

                  return (
                    <>
                      <div className="calendar-task-panel-header">
                        <h3 className="calendar-task-panel-title">
                          {month}月{day}日 · {totalCount}件待完成
                        </h3>
                        <button
                          className="calendar-task-panel-link"
                          onClick={() => setCalendarView('day')}
                        >
                          查看时间轴 ›
                        </button>
                        <button
                          className="relax-today-btn"
                          onClick={() => showConfirm({
                            title: '今日放纵',
                            subtitle: '清空今天所有计划',
                            confirmText: '放纵！'
                          }, () => {
                            setGoals(prev => prev.map(g => {
                              if (g.type === 'todo' && g.dueDate === todayStr) return null
                              if (g.type === 'task') return {
                                ...g,
                                steps: g.steps.map(s =>
                                  s.scheduledDate === todayStr ? { ...s, scheduledDate: null } : s
                                )
                              }
                              if (g.type === 'progress') {
                                const newLog = { ...g.progressLog }
                                delete newLog[todayStr]
                                const skipped = [...(g.skippedDates || []), todayStr]
                                return { ...g, progressLog: newLog, skippedDates: skipped }
                              }
                              return g
                            }).filter(Boolean))
                            showToast('去好好休息吧 🛋️', 'info')
                          })}
                        >
                          今日放纵
                        </button>
                      </div>

                      {totalCount === 0 ? (
                        <div className="calendar-task-empty">
                          <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
                            <circle cx="60" cy="60" r="50" fill="#10b98115" />
                            <path d="M60 30 L60 60 L80 80" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="60" cy="60" r="4" fill="#10b981" />
                            <path d="M40 55 Q50 45 60 55 Q70 65 80 55" stroke="#10b98140" strokeWidth="2" fill="none" />
                          </svg>
                          <p>今天轻松~ 要不要安排点什么？</p>
                        </div>
                      ) : (
                        <div className="calendar-task-list">
                          {todosOnDate.length > 0 && (
                            <div className="calendar-task-group">
                              <div className="calendar-task-group-header">
                                <span className="calendar-task-group-dot" style={{ background: TASK_COLORS.todo }} />
                                <span>待办</span>
                              </div>
                              {todosOnDate.map((todo) => (
                                <div
                                  key={todo.id}
                                  className="calendar-task-item"
                                >
                                  <div className="calendar-task-item-color" style={{ background: TASK_COLORS.todo }} />
                                  <div className="calendar-task-item-content">
                                    <span className="calendar-task-item-name">{todo.name}</span>
                                  </div>
                                  <div className="calendar-task-item-actions">
                                    <button
                                      className="calendar-task-item-btn focus"
                                      onClick={() => {
                                        setSelectedStep({ id: todo.id, text: todo.name })
                                        setIsFocusActive(true)
                                      }}
                                    >
                                      <Focus size={16} />
                                    </button>
                                    <button
                                      className="calendar-task-item-btn"
                                      onClick={() => {
                                        setGoals(prev => prev.filter(g => g.id !== todo.id))
                                        import('canvas-confetti').then((m) => m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 }))
                                        showToast('✅ 待办已完成', 'success')
                                      }}
                                    >
                                      <Circle size={20} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {habitsOnDate.length > 0 && (
                            <div className="calendar-task-group">
                              <div className="calendar-task-group-header">
                                <span className="calendar-task-group-dot" style={{ background: TASK_COLORS.progress }} />
                                <span>习惯</span>
                              </div>
                              {habitsOnDate.map((habit) => {
                                const todayProgress = habit.progressLog[selectedDate] || 0
                                const isCheckin = habit.habitType === 'checkin'
                                const isCompleted = isCheckin ? todayProgress >= 1 : todayProgress >= (habit.dailyTarget || 0)
                                const stats = computeProgressStats(habit, coachStyle)

                                return (
                                  <div
                                    key={habit.id}
                                    className="calendar-task-item"
                                  >
                                    <div className="calendar-task-item-color" style={{ background: TASK_COLORS.progress }} />
                                    <div className="calendar-task-item-content">
                                      <span className="calendar-task-item-name">{habit.name}</span>
                                      <span className="calendar-task-item-sub">
                                        {stats.currentStreak > 0 ? `连续 ${stats.currentStreak} 天` : `累计 ${stats.totalAchievedDays} 天`}
                                      </span>
                                    </div>
                                    <div className="calendar-task-item-actions">
                                      <button
                                        className="calendar-task-item-btn focus"
                                        onClick={() => handleSelectStep({
                                          id: `habit-${habit.id}`,
                                          text: habit.name,
                                          completed: false,
                                          isHabit: true,
                                          goalId: habit.id,
                                          habitType: habit.habitType,
                                          habit
                                        })}
                                      >
                                        <Focus size={16} />
                                      </button>
                                      {isCheckin ? (
                                        <button
                                          className={`calendar-task-item-btn ${isCompleted ? 'completed' : ''}`}
                                          onClick={() => handleCheckinHabit(habit.id)}
                                        >
                                          {isCompleted ? '✓' : <Circle size={20} />}
                                        </button>
                                      ) : (
                                        <button
                                          className="calendar-task-item-btn record"
                                          onClick={() => handleOpenRecordModal(habit)}
                                        >
                                          记录
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {stepsOnDate.length > 0 && (
                            <div className="calendar-task-group">
                              <div className="calendar-task-group-header">
                                <span className="calendar-task-group-dot" style={{ background: TASK_COLORS.task }} />
                                <span>步骤</span>
                              </div>
                              {stepsOnDate.map((step) => (
                                <div
                                  key={step.id}
                                  className="calendar-task-item"
                                >
                                  <div className="calendar-task-item-color" style={{ background: TASK_COLORS.task }} />
                                  <div className="calendar-task-item-content">
                                    <span className="calendar-task-item-name">{step.text}</span>
                                    <span className="calendar-task-item-sub">来自：{step.goalName}</span>
                                  </div>
                                  <div className="calendar-task-item-actions">
                                    <button
                                      className="calendar-task-item-btn focus"
                                      onClick={() => handleSelectStep({ id: step.id, text: step.text, completed: false })}
                                    >
                                      <Focus size={16} />
                                    </button>
                                    <button
                                      className="calendar-task-item-btn complete"
                                      onClick={() => {
                                        handleToggleStep(step.goalId, step.id)
                                        showToast('✅ 步骤完成！', 'success')
                                      }}
                                    >
                                      <Circle size={20} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* ===== 目标 Tab ===== */}
        {activeTab === 'tasks' && (
          <div className="section tasks-section">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <h2 className="page-title">我的目标</h2>
              <button className="settings-btn" onClick={() => setShowSettingsModal(true)} aria-label="设置">⚙️</button>
            </div>
            <p className="page-subtitle">管理你的目标、待办和习惯</p>
            
            <div className="task-filter-bar">
              {[
                { key: 'task', label: '🎯 目标', count: goals.filter(g => g.type === 'task' && !g.completed).length },
                { key: 'todo', label: '✅ 待办', count: goals.filter(g => g.type === 'todo' && !g.completed).length },
                { key: 'progress', label: '🔥 习惯', count: goals.filter(g => g.type === 'progress').length },
              ].map(f => (
                <button key={f.key} className={`task-filter-btn ${taskFilter === f.key ? 'active' : ''}`} onClick={() => setTaskFilter(f.key)}>
                  {f.label} {f.count > 0 && <span className="task-filter-count">{f.count}</span>}
                </button>
              ))}
            </div>

            {(() => {
              const filterType = taskFilter
              const activeTasks = goals.filter(g => g.type === filterType && !g.completed)
              const completedTasks = goals.filter(g => g.type === filterType && g.completed)
              const hasAnyGoals = goals.length > 0

              return (
                <>
                  {taskFilter === 'task' && activeTasks.length === 0 && completedTasks.length === 0 && (
                    <div className="empty-state-inline">
                      <p className="empty-hero">✨ 你最近最想做成什么事？</p>
                      <p className="empty-subtitle">说出来，AI 帮你拆成今天能开始的第一步</p>
                      <div className="empty-input-row">
                        <input
                          type="text"
                          className="empty-goal-input"
                          placeholder="比如：备考雅思、找工作、学吉他..."
                          value={quickGoalText || ''}
                          onChange={e => setQuickGoalText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && quickGoalText?.trim()) { setQuickGoalPending(quickGoalText.trim()); setQuickGoalText(''); setShowQuickContext(true) } }}
                        />
                        <button
                          className="empty-input-btn"
                          onClick={() => { if (quickGoalText?.trim()) { setQuickGoalPending(quickGoalText.trim()); setQuickGoalText(''); setShowQuickContext(true) } }}
                        >
                          AI 拆解 →
                        </button>
                      </div>
                      {showQuickContext && (
                        <div className="quick-context-card">
                          <p className="quick-context-goal">🎯 {quickGoalPending}</p>
                          <p className="quick-context-tip">多告诉我一点，步骤更贴合你的情况</p>
                          <div className="quick-context-row">
                            <span className="quick-context-label">大概多久完成？</span>
                            <div className="quick-chips">
                              {['1个月内','3个月','半年','更长'].map(t => (
                                <button key={t} className={`quick-chip${quickTimeframe===t?' quick-chip-active':''}`} onClick={() => setQuickTimeframe(quickTimeframe===t?'':t)}>{t}</button>
                              ))}
                            </div>
                          </div>
                          <input className="quick-context-input" placeholder="补充背景（选填）：比如「大三在读」「零基础」" maxLength={50} value={quickBackground} onChange={e => setQuickBackground(e.target.value)} />
                          <span style={{fontSize:11,color:'var(--text-light)',textAlign:'right',display:'block',marginTop:2}}>{quickBackground.length}/50</span>
                          <div className="quick-context-actions">
                            <button className="quick-context-cancel" onClick={() => setShowQuickContext(false)}>取消</button>
                            <button className="quick-context-submit" onClick={() => handleQuickAIDecompose(quickGoalPending, quickTimeframe, quickBackground)}>开始拆解 →</button>
                          </div>
                        </div>
                      )}
                      <p className="empty-or">或者选择一个场景快速开始</p>
                      <div className="quick-start-cards">
                        {quickStartOptions.slice(quickStartOffset, quickStartOffset + 3).map((card) => (
                          <button key={card.label} className="quick-start-card" onClick={() => { setQuickGoalPending(card.label); setQuickGoalText(''); setShowQuickContext(true) }}>
                            <span className="quick-start-icon">{card.icon}</span>
                            <span className="quick-start-label">{card.label}</span>
                            <span className="quick-start-desc">{card.desc}</span>
                          </button>
                        ))}
                      </div>
                      <button className="quick-start-refresh" onClick={() => setQuickStartOffset(o => (o + 3) % quickStartOptions.length)}>
                        换一批 ↻
                      </button>
                    </div>
                  )}

                  {taskFilter !== 'task' && activeTasks.length === 0 && completedTasks.length === 0 && (
                    <div className="task-filter-empty">
                      <p>{taskFilter === 'todo' ? '暂无待办事项' : '暂无习惯'}</p>
                      <span>点击右下角 + 创建</span>
                    </div>
                  )}

                  {activeTasks.length > 0 && (
                    <>
                      <div className="goals-section-header">
                        <span className="goals-section-title">⚡ 进行中</span>
                        <span className="goals-section-count">{activeTasks.length}</span>
                      </div>
                      <div className="goals-grid">
                        {activeTasks.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onUpdateGoal={handleUpdateGoal}
                            onDeleteGoal={handleDeleteGoal}
                            onAddStep={handleAddStep}
                            onToggleStep={handleToggleStep}
                            onDeleteStep={handleDeleteStep}
                            onSelectStep={handleSelectStep}
                            onRequestNotification={handleRequestNotification}
                            onAIDecompose={handleAIDecompose}
                            onCoachReview={handleCoachReview}
                            onAddExp={addExp}
                            todayStr={todayStr}
                            tomorrowStr={tomorrowStr}
                            showToast={showToast}
                            onOpenDecompose={(id) => {
                              setDecomposeGoalId(id)
                              setShowDecomposeModal(true)
                            }}
                            inCardDecomposeId={inCardDecomposeId}
                            setInCardDecomposeId={setInCardDecomposeId}
                            quickTimeframe={quickTimeframe}
                            setQuickTimeframe={setQuickTimeframe}
                            quickBackground={quickBackground}
                            setQuickBackground={setQuickBackground}
                            handleQuickAIDecompose={handleQuickAIDecompose}
                            setQuickGoalPending={setQuickGoalPending}
                            setPendingDecomposeGoalId={setPendingDecomposeGoalId}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {completedTasks.length > 0 && (
                    <>
                      <button
                        className="goals-section-header collapsed"
                        onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                      >
                        <span className="goals-section-title">🏆 已完成</span>
                        <span className="goals-section-count">{completedTasks.length}</span>
                        <span className="goals-section-arrow">{showCompletedGoals ? '▼' : '▶'}</span>
                      </button>
                      {showCompletedGoals && (
                        <div className="completed-goals-list">
                          {completedTasks.map((goal) => (
                            <GoalCard
                              key={goal.id}
                              goal={goal}
                              onUpdateGoal={handleUpdateGoal}
                              onDeleteGoal={handleDeleteGoal}
                              onAddStep={handleAddStep}
                              onToggleStep={handleToggleStep}
                              onDeleteStep={handleDeleteStep}
                              onSelectStep={handleSelectStep}
                              onRequestNotification={handleRequestNotification}
                              onAIDecompose={handleAIDecompose}
                              onCoachReview={handleCoachReview}
                              onAddExp={addExp}
                              todayStr={todayStr}
                              tomorrowStr={tomorrowStr}
                              showToast={showToast}
                              inCardDecomposeId={inCardDecomposeId}
                              setInCardDecomposeId={setInCardDecomposeId}
                              quickTimeframe={quickTimeframe}
                              setQuickTimeframe={setQuickTimeframe}
                              quickBackground={quickBackground}
                              setQuickBackground={setQuickBackground}
                              handleQuickAIDecompose={handleQuickAIDecompose}
                              setQuickGoalPending={setQuickGoalPending}
                              setPendingDecomposeGoalId={setPendingDecomposeGoalId}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* ===== 成长 Tab ===== */}
        {activeTab === 'growth' && (
          (() => {
            return (
              <div className="section growth-section">

                {(() => {
                  const myCollection = loadPlantCollection()
                  const completedStepsCount = goals.flatMap(g => g.steps||[]).filter(s => s.completed).length
                  const treeProgress = Math.min(1, completedStepsCount / 50)
                  const plantStage = treeProgress < 0.1 ? 0 : treeProgress < 0.25 ? 1 : treeProgress < 0.5 ? 2 : treeProgress < 0.7 ? 3 : treeProgress < 0.9 ? 4 : 5
                  const plantPositions = [
                    // 前景（最大、最显眼）
                    { left: '12%', bottom: '8%', size: 38, z: 4 },
                    { left: '32%', bottom: '6%', size: 42, z: 4 },
                    { left: '54%', bottom: '9%', size: 38, z: 4 },
                    { left: '76%', bottom: '5%', size: 40, z: 4 },
                    // 中景
                    { left: '6%', bottom: '28%', size: 28, z: 3 },
                    { left: '22%', bottom: '32%', size: 26, z: 3 },
                    { left: '42%', bottom: '30%', size: 30, z: 3 },
                    { left: '62%', bottom: '34%', size: 26, z: 3 },
                    { left: '82%', bottom: '28%', size: 28, z: 3 },
                    // 远景
                    { left: '15%', bottom: '50%', size: 22, z: 2 },
                    { left: '35%', bottom: '52%', size: 20, z: 2 },
                    { left: '55%', bottom: '50%', size: 22, z: 2 },
                    { left: '72%', bottom: '54%', size: 20, z: 2 },
                    // 远远景
                    { left: '10%', bottom: '66%', size: 18, z: 1 },
                    { left: '28%', bottom: '68%', size: 16, z: 1 },
                    { left: '48%', bottom: '66%', size: 18, z: 1 },
                    { left: '68%', bottom: '68%', size: 16, z: 1 },
                    { left: '85%', bottom: '64%', size: 18, z: 1 },
                    { left: '40%', bottom: '78%', size: 14, z: 1 },
                    { left: '60%', bottom: '76%', size: 14, z: 1 },
                  ]
                  return (
                    <div className="garden-card">
                      <div className="garden-scene">
                        <span className="garden-sun">☀️</span>
                        <span className="garden-cloud cloud-1">☁️</span>
                        <span className="garden-cloud cloud-2">☁️</span>
                        {myCollection.length === 0 ? (
                          <div className="garden-empty">
                            <PlantVisual stage={plantStage} size={150} health="thriving" />
                            <div className="garden-empty-text">
                              <p className="garden-empty-title">你的田园还是空的</p>
                              <p className="garden-empty-sub">完成第一个任务，就能收获你的第一株作物</p>
                            </div>
                          </div>
                        ) : (
                          myCollection.map((plant, i) => {
                            const pos = plantPositions[i % plantPositions.length]
                            return (
                              <span key={plant.id} className="garden-plant-item" style={{left:pos.left,bottom:pos.bottom,fontSize:`${pos.size}px`,zIndex:pos.z,animationDelay:`${i*0.12}s`}} title={`${plant.name}·${plant.unlockedAt}`}>{plant.emoji}</span>
                            )
                          })
                        )}
                        <div className="garden-grass"></div>
                      </div>

                      <div className="garden-info">
                        <div className="garden-info-top">
                          <span className="garden-level-badge">
                            Lv.{globalLevel} · {
                              globalLevel <= 2 ? '🌱 新农夫' :
                              globalLevel <= 5 ? '🌿 见习园丁' :
                              globalLevel <= 10 ? '🌻 田园达人' :
                              globalLevel <= 18 ? '🎋 资深农夫' : '🌳 田园大师'
                            }
                          </span>
                          <span className="garden-collection-count">
                            🌾 {myCollection.length} / {PLANT_ACHIEVEMENTS.length}
                          </span>
                        </div>
                        <div className="garden-exp-bar">
                          <div className="garden-exp-fill" style={{ width: `${globalExp % 100}%` }}/>
                        </div>
                        <span className="garden-exp-text">{globalExp % 100} / 100 EXP · 还需 {100 - (globalExp % 100)} 升级</span>
                      </div>
                    </div>
                  )
                })()}

                <button className="share-garden-btn" onClick={() => setShowShareModal(true)}>
                  🌾 分享我的田园
                </button>

                <div className="growth-today-stats">
                  {[
                    { icon: '✅', num: goals.flatMap(g => g.steps||[]).filter(s => s.completed && s.scheduledDate === todayStr).length, label: '今日步骤' },
                    { icon: '🔥', num: goals.filter(g => g.type==='progress').filter(g => { const log=g.progressLog?.[todayStr]||0; return g.habitType==='checkin'?log>=1:log>=(g.dailyTarget||1) }).length, label: '习惯打卡' },
                    { icon: '🎯', num: goals.filter(g => g.type==='task'&&!g.completed).length, label: '目标进行' }
                  ].map(item => (
                    <div key={item.label} className="growth-today-stat">
                      <span className="growth-today-icon">{item.icon}</span>
                      <span className="growth-today-num">{item.num}</span>
                      <span className="growth-today-label">{item.label}</span>
                    </div>
                  ))}
                </div>

                {(() => {
                  const collection = loadPlantCollection()
                  const unlockedIds = collection.map(p => p.id)
                  return (
                    <div className="plant-collection-section">
                      <div className="plant-collection-header">
                        <span className="plant-collection-title">🌾 田园图鉴</span>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span className="plant-collection-count">{unlockedIds.length}/{PLANT_ACHIEVEMENTS.length}</span>
                          <button className="plant-rules-btn" onClick={() => setShowRules(!showRules)}>
                            {showRules ? '收起' : '？解锁条件'}
                          </button>
                        </div>
                      </div>
                      {showRules && (
                        <div className="plant-rules-panel">
                          {PLANT_ACHIEVEMENTS.map(p => {
                            const unlocked = unlockedIds.includes(p.id)
                            return (
                              <div key={p.id} className={`plant-rule-item ${unlocked?'unlocked':''}`}>
                                <span className="plant-rule-emoji">{unlocked?p.emoji:'🔒'}</span>
                                <div className="plant-rule-info">
                                  <span className="plant-rule-name">{unlocked?p.name:'???'}</span>
                                  <span className="plant-rule-desc">{p.desc}</span>
                                </div>
                                {unlocked && <span className="plant-rule-check">✓</span>}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <div className="plant-collection-grid">
                        {PLANT_ACHIEVEMENTS.map(plant => {
                          const unlocked = unlockedIds.includes(plant.id)
                          const info = collection.find(p => p.id === plant.id)
                          return (
                            <div key={plant.id} className={`plant-collection-item ${unlocked?'unlocked':'locked'}`}>
                              <span className="plant-collection-emoji">{unlocked?plant.emoji:'🔒'}</span>
                              <span className="plant-collection-name">{unlocked?plant.name:'???'}</span>
                              {unlocked && <span className="plant-collection-date">{info?.unlockedAt?.slice(5)}</span>}
                            </div>
                          )
                        })}
                      </div>
                      {unlockedIds.length===0 && (
                        <p className="plant-collection-hint">完成第一个任务，解锁你的第一棵植物 🌱</p>
                      )}
                    </div>
                  )
                })()}

                <div className="daily-review-section">
                  <h3 className="daily-review-title">✍️ 今日手账 <span className="daily-review-optional">选填</span></h3>
                  <textarea
                    className="daily-review-textarea"
                    placeholder="记录今天的困难、心情、想法...（不写也能 AI 点评）"
                    value={dailyReviewText}
                    onChange={(e) => setDailyReviewText(e.target.value)}
                    onBlur={handleSaveDailyReview}
                  />
                  <button className="ai-review-btn" onClick={handleAIReview} disabled={isAIReviewing}>
                    {isAIReviewing ? 'AI 思考中...' : '✨ 获取今日教练点评'}
                  </button>
                  {aiComment && (() => {
                    const _cs = COACH_STYLES[loadCoachStyle()] || COACH_STYLES.gentle
                    return (
                    <div className="ai-comment-card" style={{borderLeftColor: _cs.color}}>
                      <div className="ai-comment-header">
                        <span className="coach-name-tag" style={{background: _cs.color + '18', color: _cs.color}}>
                          {_cs.name}
                        </span>
                        <span className="coach-tag-label">今日点评</span>
                      </div>
                      <div className="ai-comment-text">{aiComment}</div>
                    </div>
                    )
                  })()}
                </div>

              </div>
            )
          })()
        )}

        {/* FAB 按钮 */}
        <button className={`fab-btn ${showFABPanel ? 'active' : ''}`} onClick={handleOpenFAB}>
          <Plus size={24} />
        </button>

        {/* FAB 弹出面板 */}
        {showFABPanel && (
          <div className="fab-panel-overlay" onClick={() => setShowFABPanel(false)}>
            <div className="fab-panel" onClick={(e) => e.stopPropagation()}>
              <button
                className={`fab-panel-item ${activeTab === 'tasks' || activeTab === 'growth' ? 'highlighted' : ''}`}
                onClick={() => handleFABSelect('task')}
              >
                <div className="fab-panel-item-icon task">🎯</div>
                <div className="fab-panel-content">
                  <span className="fab-panel-title">目标</span>
                  <span className="fab-panel-desc">需要拆步骤推进的大事</span>
                </div>
              </button>
              <button
                className={`fab-panel-item ${activeTab === 'calendar' ? 'highlighted' : ''}`}
                onClick={() => handleFABSelect('todo')}
              >
                <div className="fab-panel-item-icon todo">✅</div>
                <div className="fab-panel-content">
                  <span className="fab-panel-title">待办</span>
                  <span className="fab-panel-desc">一件小事，选个日期做完就完</span>
                </div>
              </button>
              <button
                className="fab-panel-item"
                onClick={() => handleFABSelect('progress')}
              >
                <div className="fab-panel-item-icon progress">📅</div>
                <div className="fab-panel-content">
                  <span className="fab-panel-title">习惯</span>
                  <span className="fab-panel-desc">每天坚持的事</span>
                </div>
              </button>
              <button
                className="fab-panel-item"
                onClick={() => {
                  setShowFABPanel(false)
                  setSelectedStep({ id: 'free-' + Date.now(), text: '自由专注' })
                  setIsFocusActive(true)
                }}
              >
                <div className="fab-panel-item-icon" style={{background:'#0ea5e9',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center'}}>⏱</div>
                <div className="fab-panel-content">
                  <span className="fab-panel-title">专注</span>
                  <span className="fab-panel-desc">开始一段专注，屏蔽干扰</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button 
          className={`tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <div className="tab-icon">📅</div>
          <span className="tab-text">日历</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <div className="tab-icon">🎯</div>
          <span className="tab-text">目标</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          <div className="tab-icon">🌱</div>
          <span className="tab-text">成长</span>
        </button>
      </div>

      {showInstallGuide && (
        <div className="install-guide-overlay" onClick={() => { localStorage.setItem('install_guide_dismissed','true'); setShowInstallGuide(false) }}>
          <div className="install-guide-modal" onClick={e => e.stopPropagation()}>
            <div className="install-guide-icon">📲</div>
            <h3 className="install-guide-title">把田园计划装到手机</h3>
            <p className="install-guide-sub">下次直接打开，跟原生 App 一样</p>
            <div className="install-guide-steps">
              <div className="install-guide-step">
                <span className="install-step-num">iOS</span>
                <span className="install-step-text">点底部 <strong>分享</strong> → <strong>添加到主屏幕</strong></span>
              </div>
              <div className="install-guide-step">
                <span className="install-step-num">安卓</span>
                <span className="install-step-text">点右上角 <strong>菜单</strong> → <strong>添加到主屏幕</strong></span>
              </div>
            </div>
            <button className="install-guide-btn" onClick={() => { localStorage.setItem('install_guide_dismissed','true'); setShowInstallGuide(false) }}>知道了</button>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* ConfirmDialog */}
      {confirmDialog && (
        <div className="confirm-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            {confirmDialog.title ? (
              <>
                <p className="confirm-title">{confirmDialog.title}</p>
                {confirmDialog.subtitle && (
                  <p className="confirm-subtitle">{confirmDialog.subtitle}</p>
                )}
              </>
            ) : (
              <p className="confirm-message">{confirmDialog.message}</p>
            )}
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>取消</button>
              <button className="btn-danger" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}>
                {confirmDialog.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 设置弹窗 */}
      {showShareModal && (() => {
        const shareCollection = loadPlantCollection()
        const shareTotalSteps = goals.flatMap(g => g.steps || []).filter(s => s.completed).length
        const shareCompletedGoals = goals.filter(g => g.completed).length
        return (
          <div className="share-overlay" onClick={() => setShowShareModal(false)}>
            <div className="share-card-wrap" onClick={e => e.stopPropagation()}>

              {/* 分享卡片主体 */}
              <div className="share-card">
                <div className="share-card-sky">
                  <span className="share-sun">☀️</span>
                  <span className="share-cloud share-cloud-1">☁️</span>
                  <span className="share-cloud share-cloud-2">☁️</span>
                </div>

                <div className="share-card-title-block">
                  <div className="share-brand-dot" />
                  <h2 className="share-card-title">{gardenNickname ? `${gardenNickname}的田园` : '我的田园'}</h2>
                  <p className="share-card-sub">
                    收获了 {shareCollection.length} / {PLANT_ACHIEVEMENTS.length} 种作物
                  </p>
                </div>

                <div className="share-plants-area">
                  {shareCollection.length === 0 ? (
                    <div className="share-empty">
                      <span style={{fontSize:64}}>🌱</span>
                      <p style={{color:'#4d7c0f',marginTop:8,fontSize:14}}>正在努力种第一株...</p>
                    </div>
                  ) : (
                    <div className="share-plants-grid">
                      {shareCollection.map((plant, i) => (
                        <div key={plant.id} className="share-plant-item" style={{animationDelay:`${i*0.06}s`}}>
                          <span className="share-plant-emoji">{plant.emoji}</span>
                          <span className="share-plant-name">{plant.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="share-card-stats">
                  <div className="share-stat">
                    <span className="share-stat-num">{shareTotalSteps}</span>
                    <span className="share-stat-label">步骤完成</span>
                  </div>
                  <div className="share-stat-divider" />
                  <div className="share-stat">
                    <span className="share-stat-num">Lv.{globalLevel}</span>
                    <span className="share-stat-label">当前等级</span>
                  </div>
                  <div className="share-stat-divider" />
                  <div className="share-stat">
                    <span className="share-stat-num">{shareCompletedGoals}</span>
                    <span className="share-stat-label">目标达成</span>
                  </div>
                </div>

                <div className="share-card-footer">
                  <span className="share-footer-brand">🌱 田园计划</span>
                  <span className="share-footer-url">goal-pusher.vercel.app</span>
                </div>
              </div>

              {/* 昵称输入 */}
              <div className="share-nickname-wrap">
                <input
                  className="share-nickname-input"
                  placeholder="给你的田园起个名字（选填）"
                  value={gardenNickname}
                  maxLength={10}
                  onChange={e => {
                    setGardenNickname(e.target.value)
                    localStorage.setItem('garden_nickname', e.target.value)
                  }}
                />
              </div>

              {/* 操作按钮 */}
              <button className="share-save-btn" onClick={handleSaveShareCard}>
                ⬇️ 保存图片
              </button>
              <button className="share-close-btn" onClick={() => setShowShareModal(false)}>关闭</button>
            </div>
          </div>
        )
      })()}

      {showSettingsModal && (
        <div className="settings-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="settings-close" onClick={() => setShowSettingsModal(false)}>×</button>
            <h3>⚙️ 设置</h3>

            {/* 消息通知 */}
            {'Notification' in window && (
              <div className="settings-section notification-section">
                <h4>🔔 消息通知</h4>
                {Notification.permission === 'granted' ? (
                  <div className="notification-granted">
                    <span className="notification-status">✓ 已开启</span>
                  </div>
                ) : Notification.permission === 'denied' ? (
                  <p className="notification-denied">通知已被屏蔽，请在浏览器设置中手动开启</p>
                ) : (
                  <div className="notification-actions">
                    <p className="notification-hint">开启后可以收到习惯提醒和复盘通知</p>
                    <button
                      className="enable-notification-btn"
                      onClick={() => {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            new Notification('田园计划 🌱', {
                              body: '通知已开启！记得每天完成你的习惯打卡~',
                              icon: '/icon.png'
                            })
                            setShowSettingsModal(false)
                          }
                        })
                      }}
                    >
                      开启通知
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 复盘提醒 */}
            {'Notification' in window && Notification.permission === 'granted' && (
              <div className="settings-section review-reminder-section">
                <h4>✍️ 每日复盘提醒</h4>
                <div className="review-reminder-row">
                  <input
                    type="time"
                    className="review-time-input"
                    value={reviewReminder.time}
                    onChange={(e) => {
                      const newReminder = { ...reviewReminder, time: e.target.value }
                      setReviewReminder(newReminder)
                      localStorage.setItem('garden_review_reminder', JSON.stringify(newReminder))
                    }}
                  />
                  <button
                    className={`review-toggle-btn ${reviewReminder.enabled ? 'active' : ''}`}
                    onClick={() => {
                      const newReminder = { ...reviewReminder, enabled: !reviewReminder.enabled }
                      setReviewReminder(newReminder)
                      localStorage.setItem('garden_review_reminder', JSON.stringify(newReminder))
                    }}
                  >
                    {reviewReminder.enabled ? '开' : '关'}
                  </button>
                </div>
              </div>
            )}



            {/* 教练人格选择 */}
            <div className="settings-section">
              <h4>🎭 我的教练</h4>
              <div className="coach-select-grid">
                {Object.entries(COACH_STYLES).map(([key, style]) => (
                  <button
                    key={key}
                    className={`coach-select-card ${coachStyle === key ? 'selected' : ''}`}
                    onClick={() => { saveCoachStyle(key); setCoachStyle(key) }}
                  >
                    <span className="coach-card-name">{style.name}</span>
                    <span className="coach-card-slogan">"{style.slogan}"</span>
                    <div className="coach-card-examples">
                      {style.examples.map((ex, i) => (
                        <span key={i} className="coach-card-example">{ex}</span>
                      ))}
                    </div>
                    {coachStyle === key && <span className="coach-card-check">✓ 当前教练</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 用户反馈 */}
            <div className="settings-section feedback-section">
              <h4>🌱 加入田园社区</h4>
              <p className="settings-hint">内测阶段，你的每条反馈都会被认真看到<br/>和我们一起把产品做好</p>
              <div className="contact-cards">
                <div className="contact-card">
                  <span className="contact-icon">💬</span>
                  <div className="contact-info">
                    <span className="contact-label">乌萨奇教练</span>
                    <span className="contact-value">Qdyw12345</span>
                  </div>
                  <button
                    className="contact-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('Qdyw12345').then(() => {
                        showToast('已复制微信号，去搜索添加吧~', 'success')
                      }).catch(() => {
                        showToast('微信：Qdyw12345', 'info')
                      })
                    }}
                  >
                    复制
                  </button>
                </div>
                <div className="contact-card">
                  <span className="contact-icon">💬</span>
                  <div className="contact-info">
                    <span className="contact-label">黄瓜教练</span>
                    <span className="contact-value">mianaaaaa_</span>
                  </div>
                  <button
                    className="contact-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('mianaaaaa_').then(() => {
                        showToast('已复制微信号，去搜索添加吧~', 'success')
                      }).catch(() => {
                        showToast('微信：mianaaaaa_', 'info')
                      })
                    }}
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>

            {/* 数据管理 */}
            <div className="settings-section">
              <h4>📊 数据管理</h4>
              <div className="data-actions">
                <button className="data-action-btn" onClick={handleExportData}>
                  📤 导出数据
                </button>
                <button className="data-action-btn" onClick={handleImportData}>
                  📥 导入数据
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 拆解上下文弹窗 */}
      {showDecomposeModal && (
        <div className="addgoal-overlay" onClick={() => setShowDecomposeModal(false)}>
          <div className="decompose-modal" onClick={e => e.stopPropagation()}>
            <button className="addgoal-close" onClick={() => setShowDecomposeModal(false)}>×</button>
            <h3 className="decompose-modal-title">✨ AI 帮你拆解步骤</h3>
            <p className="decompose-modal-sub">告诉我你的情况，步骤会更贴合你</p>

            <div className="decompose-field">
              <label className="decompose-label">打算多久内完成？</label>
              <div className="decompose-options">
                {['1周', '2周', '1个月', '2个月', '3个月以上'].map(w => (
                  <button
                    key={w}
                    className={`decompose-option ${decomposeWeeks === w ? 'selected' : ''}`}
                    onClick={() => setDecomposeWeeks(w)}
                  >{w}</button>
                ))}
              </div>
            </div>

            <div className="decompose-field">
              <label className="decompose-label">每天能投入多少时间？</label>
              <div className="decompose-options">
                {['30分钟', '1小时', '2小时', '3小时以上'].map(h => (
                  <button
                    key={h}
                    className={`decompose-option ${decomposeHours === h ? 'selected' : ''}`}
                    onClick={() => setDecomposeHours(h)}
                  >{h}</button>
                ))}
              </div>
            </div>

            <button
              className="decompose-confirm-btn"
              onClick={() => {
                setShowDecomposeModal(false)
                handleAIDecompose(decomposeGoalId, {
                  weeks: decomposeWeeks,
                  hours: decomposeHours
                })
              }}
            >
              开始拆解 ✨
            </button>
          </div>
        </div>
      )}

      {/* 专注计时器弹窗 - 增加双重条件防护 */}
      {selectedStep && selectedStep.id && selectedStep.text && isFocusActive && (
        <FocusTimer
          key={`focus-timer-${selectedStep.id}`}
          selectedStep={selectedStep}
          onClose={handleCloseTimer}
          onRecordActivity={recordActivity}
          onHabitComplete={handleHabitComplete}
        />
      )}

      {/* 学期计划生成器弹窗 */}
      {showGeneratePlanModal && (
        <div className="addgoal-overlay" onClick={() => setShowGeneratePlanModal(false)}>
          <div className="addgoal-modal plan-generator-modal" onClick={(e) => e.stopPropagation()}>
            <button className="addgoal-close" onClick={() => setShowGeneratePlanModal(false)}>×</button>
            <h3>告诉我你的情况</h3>
            
            <div className="plan-generator-form">
              {/* 身份选择 */}
              <div className="form-group">
                <label className="form-label">你目前的身份</label>
                <div className="card-group">
                  {['大一', '大二', '大三', '大四', '研究生', '其他'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`card-option ${planIdentity === item ? 'is-selected' : ''}`}
                      onClick={() => setPlanIdentity(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 目标选择（多选最多2个） */}
              <div className="form-group">
                <label className="form-label">
                  你最重要的目标是
                  <span className="form-label-hint">最多选 2 个 · 已选 {planGoals.length}/2</span>
                </label>
                <div className="card-group">
                  {['考研备考', '秋招求职', '英语考试(四六级/雅思)', '专业课学习', '副业创业', '技能提升', '其他'].map((item) => {
                    const selected = planGoals.includes(item)
                    const disabled = !selected && planGoals.length >= 2
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`card-option ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                        disabled={disabled}
                        onClick={() => {
                          if (!disabled) togglePlanGoal(item)
                        }}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
                {planGoals.includes('其他') && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入你的目标，比如「学吉他」"
                    style={{marginTop: 8, width: '100%', boxSizing: 'border-box'}}
                    value={planCustomGoal || ''}
                    onChange={e => setPlanCustomGoal(e.target.value)}
                  />
                )}
              </div>

              {/* 时间选择 */}
              <div className="form-group">
                <label className="form-label">距离主要目标大概还有</label>
                <div className="card-group">
                  {['1个月内', '1-3个月', '3-6个月', '半年以上'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`card-option ${planTimeframe === item ? 'is-selected' : ''}`}
                      onClick={() => setPlanTimeframe(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className="generate-plan-submit-btn"
                onClick={handleGeneratePlan}
                disabled={planGeneratorLoading || planGoals.length === 0}
              >
                {planGeneratorLoading ? '生成中...' : '⚡ 生成我的计划'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建目标弹窗 */}
      {showAddGoalModal && (
        <div className="addgoal-overlay" onClick={handleCloseAddGoalModal}>
          <div className="addgoal-modal" onClick={(e) => e.stopPropagation()}>
            <button className="addgoal-close" onClick={handleCloseAddGoalModal}>×</button>
            <h3>
              {fabPreselectedType === 'todo' && '➕ 新建待办'}
              {fabPreselectedType === 'progress' && '➕ 新建习惯'}
              {(fabPreselectedType === 'task' || fabPreselectedType === null) && '➕ 新建目标'}
            </h3>
            
            <div className="addgoal-form">
              <div className="form-group">
                <label className="form-label">
                  {fabPreselectedType === 'todo' && '待办内容'}
                  {fabPreselectedType === 'progress' && '习惯名称'}
                  {(fabPreselectedType === 'task' || fabPreselectedType === null) && '目标名称'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    fabPreselectedType === 'todo' ? '例如：回复导师邮件' :
                    fabPreselectedType === 'progress' ? '例如：每天跑步' :
                    '例如：准备期末考试'
                  }
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  autoFocus
                />
              </div>

              {fabPreselectedType === null && (
                <div className="form-group">
                  <label className="form-label">目标类型</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="goalType"
                        value="task"
                        checked={newGoalType === 'task'}
                        onChange={(e) => setNewGoalType(e.target.value)}
                      />
                      <span>📋 目标</span>
                      <span className="radio-description">有步骤要推进的大事，如：准备考研、优化简历</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="goalType"
                        value="progress"
                        checked={newGoalType === 'progress'}
                        onChange={(e) => setNewGoalType(e.target.value)}
                      />
                      <span>📅 习惯</span>
                      <span className="radio-description">每天做一点，长期积累，如：背单词、健身打卡</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="goalType"
                        value="todo"
                        checked={newGoalType === 'todo'}
                        onChange={(e) => setNewGoalType(e.target.value)}
                      />
                      <span>✅ 待办</span>
                      <span className="radio-description">一次性小事，做完就完，如：回复邮件、买教材</span>
                    </label>
                  </div>
                </div>
              )}

              {newGoalType === 'progress' && (
                <div className="form-group">
                  <label className="form-label">习惯类型</label>
                  <div className="habit-type-cards">
                    <button
                      type="button"
                      className={`habit-type-card ${newHabitType === 'checkin' ? 'selected' : ''}`}
                      onClick={() => setNewHabitType('checkin')}
                    >
                      <span className="habit-type-icon">✓</span>
                      <span className="habit-type-title">打卡型</span>
                      <span className="habit-type-desc">做了就算，每天勾一下</span>
                      <span className="habit-type-example">如：早起、读书、冥想</span>
                    </button>
                    <button
                      type="button"
                      className={`habit-type-card ${newHabitType === 'count' ? 'selected' : ''}`}
                      onClick={() => setNewHabitType('count')}
                    >
                      <span className="habit-type-icon">#</span>
                      <span className="habit-type-title">计数型</span>
                      <span className="habit-type-desc">记录完成数量</span>
                      <span className="habit-type-example">如：背单词、跑步公里数</span>
                    </button>
                  </div>
                </div>
              )}

              {newGoalType === 'progress' && newHabitType === 'count' && (
                <div className="form-group">
                  <label className="form-label">每日目标量</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="30"
                    value={newGoalDailyTarget}
                    onChange={(e) => setNewGoalDailyTarget(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
              )}

              {newGoalType === 'todo' && (
                <div className="form-group">
                  <label className="form-label">截止日期</label>
                  <div className="date-quick-buttons">
                    <button
                      className={`date-quick-btn ${newGoalDueDate === todayStr ? 'active' : ''}`}
                      onClick={() => {
                        setNewGoalDueDate(todayStr)
                        setShowDatePicker(false)
                      }}
                    >
                      今天
                    </button>
                    <button
                      className={`date-quick-btn ${newGoalDueDate === tomorrowStr ? 'active' : ''}`}
                      onClick={() => {
                        setNewGoalDueDate(tomorrowStr)
                        setShowDatePicker(false)
                      }}
                    >
                      明天
                    </button>
                    <button
                      className={`date-quick-btn ${showDatePicker ? 'active' : ''}`}
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      选择日期...
                    </button>
                  </div>
                  {showDatePicker && (
                    <input
                      type="date"
                      className="form-input date-picker-input"
                      value={newGoalDueDate}
                      onChange={(e) => {
                        setNewGoalDueDate(e.target.value)
                        setShowDatePicker(false)
                      }}
                    />
                  )}
                </div>
              )}

              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCloseAddGoalModal}>
                  取消
                </button>
                <button className="btn-primary" onClick={handleConfirmAddGoal}>
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 记录进度弹窗 */}
      {showRecordModal && currentGoalForRecord && (
        <div className="record-overlay" onClick={handleCloseRecordModal}>
          <div className="record-modal" onClick={(e) => e.stopPropagation()}>
            <button className="record-close" onClick={handleCloseRecordModal}>×</button>
            <h3>📝 记录今日进度 - {currentGoalForRecord.name}</h3>
            
            <div className="record-form">
              <div className="form-group">
                <label className="form-label">今天完成了多少？</label>
                <input
                  type="number"
                  className="form-input"
                  value={recordValue}
                  onChange={(e) => setRecordValue(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  autoFocus
                />
              </div>

              <div className="quick-add-buttons">
                <button className="quick-add-btn" onClick={() => handleQuickAdd(5)}>
                  +5
                </button>
                <button className="quick-add-btn" onClick={() => handleQuickAdd(10)}>
                  +10
                </button>
                <button className="quick-add-btn" onClick={() => handleQuickAdd(currentGoalForRecord.dailyTarget || 0)}>
                  +一组(={currentGoalForRecord.dailyTarget})
                </button>
                <button className="quick-add-btn quick-add-subtract" onClick={() => handleQuickAdd(-(currentGoalForRecord.dailyTarget || 0))}>
                  减一组
                </button>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCloseRecordModal}>
                  取消
                </button>
                <button className="btn-primary" onClick={handleConfirmRecord}>
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 任务时间安排 BottomSheet */}
      <BottomSheet isOpen={showTimeSheet} onClose={handleCloseTimeSheet}>
        {timeSheetTask && (
          <div className="time-sheet">
            <div className="time-sheet-header">
              <span className="time-sheet-title">{timeSheetTask.name || timeSheetTask.text}</span>
              <span className="time-sheet-date">{timeSheetTask.dueDate || timeSheetTask.scheduledDate}</span>
            </div>

            <div className="time-sheet-section">
              <div className="time-sheet-row" onClick={() => setShowTimePicker(!showTimePicker)}>
                <span className="time-sheet-label">⏰ 安排时间</span>
                <span className={`time-sheet-value ${!timeSheetTask.scheduledTime ? 'unscheduled' : ''}`}>
                  {timeSheetTask.scheduledTime
                    ? `${timeSheetTask.scheduledTime} - ${timeSheetTask.scheduledEndTime || ''}`
                    : '未安排'}
                </span>
              </div>

              {showTimePicker && (
                <div className="time-picker">
                  <div className="time-picker-row">
                    <select
                      value={timeSheetTask.scheduledTime?.split(':')[0] || '20'}
                      onChange={(e) => {
                        const hour = e.target.value
                        const newStartTime = `${hour}:00`
                        const newEndHour = String(parseInt(hour) + 1).padStart(2, '0')
                        const newEndTime = `${newEndHour}:00`
                        handleUpdateTaskTime(newStartTime, newEndTime)
                        setTimeSheetTask(prev => prev ? {
                          ...prev,
                          scheduledTime: newStartTime,
                          scheduledEndTime: newEndTime
                        } : null)
                      }}
                    >
                      {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                        <option key={h} value={String(h).padStart(2, '0')}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <span className="time-picker-sep">—</span>
                    <select
                      value={timeSheetTask.scheduledEndTime?.split(':')[0] || '21'}
                      onChange={(e) => {
                        const hour = e.target.value
                        const newEndTime = `${hour}:00`
                        handleUpdateTaskTime(timeSheetTask.scheduledTime, newEndTime)
                        setTimeSheetTask(prev => prev ? {
                          ...prev,
                          scheduledEndTime: newEndTime
                        } : null)
                      }}
                    >
                      {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                        <option key={h} value={String(h).padStart(2, '0')}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  {timeSheetTask.scheduledTime && (
                    <button
                      className="time-picker-clear"
                      onClick={() => {
                        handleUpdateTaskTime(null, null)
                        setTimeSheetTask(prev => prev ? {
                          ...prev,
                          scheduledTime: null,
                          scheduledEndTime: null
                        } : null)
                      }}
                    >
                      清除时间
                    </button>
                  )}
                </div>
              )}
            </div>

            {timeSheetType === 'progress' && (
              <div className="time-sheet-section">
                <div className="time-sheet-row">
                  <span className="time-sheet-label">🔔 每日提醒</span>
                  <input
                    type="time"
                    className="reminder-time-input"
                    value={timeSheetTask.reminderTime || ''}
                    onChange={(e) => {
                      const newReminderTime = e.target.value || null
                      handleUpdateGoal(timeSheetTask.id, (g) => ({
                        ...g,
                        reminderTime: newReminderTime
                      }))
                      setTimeSheetTask(prev => prev ? {
                        ...prev,
                        reminderTime: newReminderTime
                      } : null)
                    }}
                  />
                </div>
                {timeSheetTask.reminderTime && (
                  <button
                    className="reminder-clear-btn"
                    onClick={() => {
                      handleUpdateGoal(timeSheetTask.id, (g) => ({
                        ...g,
                        reminderTime: null
                      }))
                      setTimeSheetTask(prev => prev ? {
                        ...prev,
                        reminderTime: null
                      } : null)
                    }}
                  >
                    清除提醒
                  </button>
                )}
              </div>
            )}

            <div className="time-sheet-actions">
              <button className="btn-primary" onClick={handleCloseTimeSheet}>
                完成
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      <footer className="app-footer">
        <p>数据保存在本地浏览器中，关闭不丢失~</p>
        <p className="author-text">作者：豆浆</p>
      </footer>

      {showOnboarding && (
        <Onboarding
          key="onboarding-modal"
          onComplete={() => {
            localStorage.setItem('garden_onboarded', 'true')
            setShowOnboarding(false)
            setActiveTab('tasks')
          }}
        />
      )}
    </div>
  )
}

export default App
