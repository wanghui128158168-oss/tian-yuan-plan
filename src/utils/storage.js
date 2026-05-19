import { STORAGE_KEY, THEME_KEY, ACTIVITY_KEY, DAILY_STEP_CAP } from '../constants'
import { getLocalDateStr } from './dateUtils'

export const loadData = () => {
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

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存数据失败:', e)
  }
}

export const loadTheme = () => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) return saved
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export const saveTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme)
}

export const loadActivity = () => {
  const saved = localStorage.getItem(ACTIVITY_KEY)
  return saved ? JSON.parse(saved) : {}
}

export const saveActivity = (data) => {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存活动数据失败:', e)
  }
}

export const recordActivity = (dateStr = null) => {
  const activity = loadActivity()
  const today = dateStr || getLocalDateStr()
  activity[today] = (activity[today] || 0) + 1
  saveActivity(activity)
}

export const loadPlantCollection = () => {
  try {
    const saved = localStorage.getItem('plant_collection')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

export const savePlantCollection = (data) => {
  localStorage.setItem('plant_collection', JSON.stringify(data))
}

export const loadCappedSteps = () => {
  try {
    const saved = localStorage.getItem('plant_capped_steps')
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

export const saveCappedSteps = (data) => {
  localStorage.setItem('plant_capped_steps', JSON.stringify(data))
}

export const addCappedStep = () => {
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

export const getTotalCappedSteps = () => {
  const data = loadCappedSteps()
  return Object.values(data).reduce((sum, n) => sum + n, 0)
}

export const loadCreditedSteps = () => {
  try { return new Set(JSON.parse(localStorage.getItem('plant_credited_steps') || '[]')) }
  catch { return new Set() }
}

export const saveCreditedSteps = (set) => {
  localStorage.setItem('plant_credited_steps', JSON.stringify([...set]))
}

export const loadRescueLog = () => {
  const saved = localStorage.getItem('goal_promoter_rescue_log')
  return saved ? JSON.parse(saved) : {}
}

export const saveRescueLog = (data) => {
  localStorage.setItem('goal_promoter_rescue_log', JSON.stringify(data))
}

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2)

export const createNewGoal = (name, type, dailyTarget, dueDate = null, habitType = 'count') => ({
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

export const createInspirationGoal = (template) => ({
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

export const getRandomInspirations = (count = 3) => {
  const { INSPIRATION_TEMPLATES } = require('../constants')
  const shuffled = [...INSPIRATION_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
