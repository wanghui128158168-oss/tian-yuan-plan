import { supabase, signIn, signUp, signOut, fetchGoals, upsertGoal, fetchUserStats, upsertUserStats, fetchPlantCollection, migrateLocalDataToSupabase } from './utils/supabase'
import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { callAI } from './utils/ai'
import PlantVisual from './PlantVisual'
import BottomSheet from './BottomSheet'
import Onboarding from './Onboarding'
import {
  Trash2, Plus, X,
  Focus, Bell, Edit3, Activity,
  Circle, ChevronLeft, ChevronRight,
  Calendar, Target, Sprout
} from 'lucide-react'
import { COACH_STYLES, loadCoachStyle, saveCoachStyle, fireConfetti } from './utils/confetti'
import { PLANT_ACHIEVEMENTS, COACH_TOAST_MESSAGES, TASK_COLORS } from './constants'
import { loadData, saveData, loadTheme, saveTheme, loadActivity, saveActivity, recordActivity, loadPlantCollection, savePlantCollection, loadCappedSteps, saveCappedSteps, addCappedStep, getTotalCappedSteps, loadCreditedSteps, saveCreditedSteps, loadRescueLog, saveRescueLog, generateId, createNewGoal, createInspirationGoal, getRandomInspirations } from './utils/storage'
import { getLocalDateStr, getTomorrowStr, daysBetween, getWeekDays, formatDateLabel, getMonthDays, cleanJSON, computeProgressStats } from './utils/dateUtils'
import FocusTimer from './components/FocusTimer'
import GoalCard from './components/GoalCard'
import CalendarView from './components/CalendarView'
import TasksView from './components/TasksView'
import GrowthView from './components/GrowthView'

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

const THEME_KEY = 'goal_promoter_theme'


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
  const [currentUser, setCurrentUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user)
        loadUserDataFromSupabase(session.user.id)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user)
        loadUserDataFromSupabase(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

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
  const [expFloat, setExpFloat] = useState(null)

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

  const loadUserDataFromSupabase = async (userId) => {
    try {
      if (!localStorage.getItem('supabase_migrated')) {
        await migrateLocalDataToSupabase(userId)
        showToast('✅ 数据已同步到云端', 'success')
      }
      const remoteGoals = await fetchGoals(userId)
      if (remoteGoals.length > 0) {
        const mapped = remoteGoals.map(g => ({
          id: g.id, name: g.name, type: g.type,
          steps: g.steps || [], notes: g.notes || '',
          reminderTime: g.reminder_time, dailyTarget: g.daily_target,
          progressLog: g.progress_log || {}, completed: g.completed,
          dueDate: g.due_date, habitType: g.habit_type,
          createdAt: g.created_at
        }))
        setGoals(mapped)
      }
      const stats = await fetchUserStats(userId)
      if (stats) {
        setGlobalExp(stats.global_exp || 0)
        setGlobalLevel(stats.global_level || 1)
        localStorage.setItem('global_exp', String(stats.global_exp || 0))
        localStorage.setItem('global_level', String(stats.global_level || 1))
      }
      const plants = await fetchPlantCollection(userId)
      if (plants.length > 0) {
        const mapped = plants.map(p => ({ id: p.plant_id, unlockedAt: p.unlocked_at }))
        localStorage.setItem('plant_collection', JSON.stringify(mapped))
      }
    } catch (e) {
      console.error('加载云端数据失败', e)
    }
  }

  // 增加全局 EXP
  const addExp = (amount) => {
    setExpFloat({ amount, key: Date.now() })
    setTimeout(() => setExpFloat(null), 1200)
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

    if (currentUser) {
      setTimeout(() => {
        setGoals(prev => {
          const newGoal = prev[0]
          if (newGoal) upsertGoal(newGoal, currentUser.id).catch(console.error)
          return prev
        })
      }, 300)
    }
  }

  // 删除目标
  const handleDeleteGoal = (goalId) => {
    showConfirm('确定要删除这个目标吗？', () => {
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
      if (currentUser) {
        import('./utils/supabase').then(({ deleteGoalRemote }) => {
          deleteGoalRemote(goalId).catch(console.error)
        })
      }
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

            if (!currentUser && !localStorage.getItem('register_prompted')) {
              setTimeout(() => {
                localStorage.setItem('register_prompted', 'true')
                showConfirm({
                  title: '🎉 第一步完成了！',
                  subtitle: '注册账号，进度永久保存，换设备不丢失',
                  confirmText: '注册'
                }, () => {
                  setAuthMode('register')
                  setShowAuthModal(true)
                })
              }, 1500)
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
    if (currentUser) {
      setTimeout(() => {
        setGoals(prev => {
          const updatedGoal = prev.find(g => g.id === goalId)
          if (updatedGoal) {
            upsertGoal(updatedGoal, currentUser.id).catch(console.error)
          }
          return prev
        })
        upsertUserStats(currentUser.id, {
          globalExp,
          globalLevel,
          cappedSteps: JSON.parse(localStorage.getItem('plant_capped_steps') || '{}'),
          activity: JSON.parse(localStorage.getItem('goal_promoter_activity') || '{}'),
          creditedSteps: JSON.parse(localStorage.getItem('plant_credited_steps') || '[]')
        }).catch(console.error)
      }, 300)
    }
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
            <span className="app-brand-sub">认真做事</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'calendar' && (
          <CalendarView
            goals={goals}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            currentWeekStart={currentWeekStart}
            setCurrentWeekStart={setCurrentWeekStart}
            todayStr={todayStr}
            coachStyle={coachStyle}
            showToast={showToast}
            handleSelectStep={handleSelectStep}
            handleCheckinHabit={handleCheckinHabit}
            handleOpenRecordModal={handleOpenRecordModal}
            handleOpenTimeSheet={handleOpenTimeSheet}
            handleToggleStep={handleToggleStep}
            showConfirm={showConfirm}
            setGoals={setGoals}
            setIsFocusActive={setIsFocusActive}
            setSelectedStep={setSelectedStep}
            globalLevel={globalLevel}
            globalExp={globalExp}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            goals={goals}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            showToast={showToast}
            handleUpdateGoal={handleUpdateGoal}
            handleDeleteGoal={handleDeleteGoal}
            handleAddStep={handleAddStep}
            handleToggleStep={handleToggleStep}
            handleDeleteStep={handleDeleteStep}
            handleSelectStep={handleSelectStep}
            handleRequestNotification={handleRequestNotification}
            handleAIDecompose={handleAIDecompose}
            handleCoachReview={handleCoachReview}
            addExp={addExp}
            todayStr={todayStr}
            tomorrowStr={tomorrowStr}
            showCompletedGoals={showCompletedGoals}
            setShowCompletedGoals={setShowCompletedGoals}
            onOpenDecompose={(id) => { setDecomposeGoalId(id); setShowDecomposeModal(true) }}
            inCardDecomposeId={inCardDecomposeId}
            setInCardDecomposeId={setInCardDecomposeId}
            quickTimeframe={quickTimeframe}
            setQuickTimeframe={setQuickTimeframe}
            quickBackground={quickBackground}
            setQuickBackground={setQuickBackground}
            handleQuickAIDecompose={handleQuickAIDecompose}
            setQuickGoalPending={setQuickGoalPending}
            setPendingDecomposeGoalId={setPendingDecomposeGoalId}
            quickGoalText={quickGoalText}
            setQuickGoalText={setQuickGoalText}
            showQuickContext={showQuickContext}
            setShowQuickContext={setShowQuickContext}
            quickGoalPending={quickGoalPending}
            quickStartOffset={quickStartOffset}
            setQuickStartOffset={setQuickStartOffset}
            setShowSettingsModal={setShowSettingsModal}
            currentUser={currentUser}
            setShowAuthModal={setShowAuthModal}
          />
        )}

        {activeTab === 'growth' && (
          <GrowthView
            goals={goals}
            todayStr={todayStr}
            globalLevel={globalLevel}
            globalExp={globalExp}
            showToast={showToast}
            dailyReviewText={dailyReviewText}
            setDailyReviewText={setDailyReviewText}
            handleSaveDailyReview={handleSaveDailyReview}
            aiComment={aiComment}
            handleAIReview={handleAIReview}
            isAIReviewing={isAIReviewing}
            showRules={showRules}
            setShowRules={setShowRules}
            setShowShareModal={setShowShareModal}
          />
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
          <div className="tab-icon">
            <Calendar size={22} strokeWidth={activeTab === 'calendar' ? 2.2 : 1.5} />
          </div>
          <span className="tab-text">日历</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <div className="tab-icon">
            <Target size={22} strokeWidth={activeTab === 'tasks' ? 2.2 : 1.5} />
          </div>
          <span className="tab-text">目标</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          <div className="tab-icon">
            <Sprout size={22} strokeWidth={activeTab === 'growth' ? 2.2 : 1.5} />
          </div>
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

      {showAuthModal && (
        <div className="confirm-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}
            style={{ width: 'min(340px, 90vw)', padding: 28 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>
              {authMode === 'login' ? '登录田园计划' : '创建账号'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#86868B' }}>
              {authMode === 'login' ? '登录后数据云端同步，换设备不丢失' : '注册后数据永久保存'}
            </p>
            <input type="email" placeholder="邮箱" value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1px solid #E5E5EA', fontSize: 15, marginBottom: 10,
                boxSizing: 'border-box', outline: 'none' }} />
            <input type="password" placeholder="密码（至少6位）" value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1px solid #E5E5EA', fontSize: 15, marginBottom: 20,
                boxSizing: 'border-box', outline: 'none' }} />
            <button disabled={authLoading} onClick={async () => {
                if (!authEmail || !authPassword) return
                setAuthLoading(true)
                try {
                  if (authMode === 'login') {
                    const { error } = await signIn(authEmail, authPassword)
                    if (error) throw error
                  } else {
                    const { error } = await signUp(authEmail, authPassword)
                    if (error) throw error
                  }
                  setShowAuthModal(false)
                  showToast('✅ ' + (authMode === 'login' ? '登录成功' : '注册成功'), 'success')
                } catch (e) {
                  showToast(e.message || '操作失败', 'error')
                } finally { setAuthLoading(false) }
              }}
              style={{ width: '100%', padding: 14, background: '#1B7A3D', color: 'white',
                border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600,
                cursor: 'pointer', opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? '处理中...' : (authMode === 'login' ? '登录' : '注册')}
            </button>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              style={{ width: '100%', marginTop: 12, padding: 10, background: 'none',
                border: 'none', color: '#86868B', fontSize: 14, cursor: 'pointer' }}>
              {authMode === 'login' ? '没有账号？注册' : '已有账号？登录'}
            </button>
            {currentUser && (
              <button onClick={async () => {
                  await signOut()
                  setShowAuthModal(false)
                  showToast('已退出登录', 'info')
                }}
                style={{ width: '100%', marginTop: 8, padding: 10, background: 'none',
                  border: 'none', color: '#FF3B30', fontSize: 14, cursor: 'pointer' }}>
                退出登录
              </button>
            )}
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

      {expFloat && (
        <div key={expFloat.key} className="exp-float-anim">
          +{expFloat.amount} EXP
        </div>
      )}
    </div>
  )
}

export default App
