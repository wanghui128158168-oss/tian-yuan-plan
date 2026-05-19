import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cuyoestnkgiyrmoqhnsz.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Egb8bzzCyxrVQvKlVAZKYg_Yg4mZmU6'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ===== Auth =====
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = () => supabase.auth.getUser()

// ===== Goals =====
export const fetchGoals = async (userId) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const upsertGoal = async (goal, userId) => {
  const { error } = await supabase.from('goals').upsert({
    id: goal.id,
    user_id: userId,
    name: goal.name,
    type: goal.type,
    steps: goal.steps || [],
    notes: goal.notes || '',
    reminder_time: goal.reminderTime || null,
    daily_target: goal.dailyTarget || null,
    progress_log: goal.progressLog || {},
    completed: goal.completed || false,
    due_date: goal.dueDate || null,
    habit_type: goal.habitType || null,
    created_at: goal.createdAt || Date.now()
  })
  if (error) throw error
}

export const deleteGoalRemote = async (goalId) => {
  const { error } = await supabase.from('goals').delete().eq('id', goalId)
  if (error) throw error
}

// ===== User Stats =====
export const fetchUserStats = async (userId) => {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

export const upsertUserStats = async (userId, stats) => {
  const { error } = await supabase.from('user_stats').upsert({
    user_id: userId,
    global_exp: stats.globalExp,
    global_level: stats.globalLevel,
    capped_steps: stats.cappedSteps || {},
    activity: stats.activity || {},
    credited_steps: stats.creditedSteps || []
  })
  if (error) throw error
}

// ===== Plant Collection =====
export const fetchPlantCollection = async (userId) => {
  const { data, error } = await supabase
    .from('plant_collection')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export const upsertPlant = async (plant, userId) => {
  const { error } = await supabase.from('plant_collection').upsert({
    id: `${userId}_${plant.id}`,
    user_id: userId,
    plant_id: plant.id,
    unlocked_at: plant.unlockedAt
  })
  if (error) throw error
}

// ===== 把 localStorage 数据迁移到 Supabase =====
export const migrateLocalDataToSupabase = async (userId) => {
  try {
    // 迁移目标
    const localGoals = JSON.parse(localStorage.getItem('goal_promoter_data') || '[]')
    for (const goal of localGoals) {
      await upsertGoal(goal, userId)
    }
    // 迁移成长数据
    const exp = parseInt(localStorage.getItem('global_exp') || '0')
    const level = parseInt(localStorage.getItem('global_level') || '1')
    const cappedSteps = JSON.parse(localStorage.getItem('plant_capped_steps') || '{}')
    const activity = JSON.parse(localStorage.getItem('goal_promoter_activity') || '{}')
    const creditedSteps = JSON.parse(localStorage.getItem('plant_credited_steps') || '[]')
    await upsertUserStats(userId, {
      globalExp: exp, globalLevel: level,
      cappedSteps, activity, creditedSteps
    })
    // 迁移植物收藏
    const plants = JSON.parse(localStorage.getItem('plant_collection') || '[]')
    for (const plant of plants) {
      await upsertPlant(plant, userId)
    }
    localStorage.setItem('supabase_migrated', 'true')
    return true
  } catch (e) {
    console.error('迁移失败', e)
    return false
  }
}
