export const getLocalDateStr = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const getTomorrowStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return getLocalDateStr(d)
}

export const daysBetween = (dateStr1, dateStr2) => {
  const d1 = new Date(dateStr1)
  const d2 = new Date(dateStr2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const getWeekDays = (weekStartStr) => {
  const days = []
  const start = new Date(weekStartStr)
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(getLocalDateStr(day))
  }
  return days
}

export const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return { month, day, weekday, full: `${month}月${day}日 星期${weekday}` }
}

export const getMonthDays = (year, month) => {
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

export const getWeekNumber = (dateStr) => {
  const date = new Date(dateStr)
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

export const cleanJSON = (str) => {
  return str
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim()
}

export const computeProgressStats = (goal, coachStyle) => {
  const { progressLog = {}, dailyTarget = 0 } = goal
  const achievedDates = Object.entries(progressLog)
    .filter(([, value]) => value >= dailyTarget)
    .map(([date]) => date)
    .sort()
  const totalAchievedDays = achievedDates.length
  let currentStreak = 0
  let maxStreak = 0
  if (totalAchievedDays > 0) {
    const streaks = []
    let currentStreakLength = 1
    for (let i = 1; i < achievedDates.length; i++) {
      const diff = daysBetween(achievedDates[i - 1], achievedDates[i])
      if (diff <= 2) {
        currentStreakLength++
      } else {
        streaks.push(currentStreakLength)
        currentStreakLength = 1
      }
    }
    streaks.push(currentStreakLength)
    maxStreak = Math.max(...streaks)
    const today = getLocalDateStr()
    const lastDate = achievedDates[achievedDates.length - 1]
    const daysDiff = daysBetween(lastDate, today)
    if (daysDiff <= 2) {
      currentStreak = streaks[streaks.length - 1]
    }
  }
  const todayStr = getLocalDateStr()
  const todayValue = progressLog[todayStr] || 0
  const achieved = todayValue >= dailyTarget
  let coachMsg = ''
  if (coachStyle === 'harsh') {
    if (!achieved) coachMsg = `🌶️ 今天才 ${todayValue}/${dailyTarget}，${dailyTarget - todayValue > 10 ? '差太远了' : '还差一点'}`
    else coachMsg = '🌶️ 算你及格'
  } else if (coachStyle === 'gentle') {
    if (!achieved) coachMsg = `🌟 今天 ${todayValue}/${dailyTarget}，加油~`
    else coachMsg = '🌟 你超棒！'
  } else {
    if (!achieved) coachMsg = `🦉 当前 ${todayValue}/${dailyTarget}`
    else coachMsg = '🦉 已达标'
  }
  return {
    currentStreak,
    maxStreak,
    totalAchievedDays,
    todayValue,
    achieved,
    coachMsg
  }
}
