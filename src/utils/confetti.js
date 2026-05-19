import confetti from 'canvas-confetti'

// 触发撒花动画
export const fireConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}

// 播放胜利音效（使用 Web Audio API）
export const playVictorySound = () => {
  // 创建音频上下文
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // 创建振荡器（三角波）
  const oscillator = audioContext.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
  oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
  oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
  
  // 创建增益节点（控制音量）
  const gainNode = audioContext.createGain()
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
  
  // 连接节点
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // 播放
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.4)
}

// 检查并处理首次完成音效
export const handleFirstCompletion = () => {
  const hasPlayed = localStorage.getItem('goal_pusher_first_sound_played')
  
  if (!hasPlayed) {
    playVictorySound()
    localStorage.setItem('goal_pusher_first_sound_played', 'true')
    return true
  }
  
  return false
}

// 教练风格配置
export const COACH_STYLES = {
  harsh: {
    id: 'harsh',
    name: '🌶️ 辣椒教练',
    slogan: '废话少说，做就完了',
    desc: '毒舌但有效，说真话不留情面',
    examples: ['"就这点进度？植物都要放弃你了"', '"别找借口，今天的任务还差两个"'],
    color: '#ef4444',
    decomposePrompt: '你是一个毒舌但真诚的效率教练，说话直接犀利，不废话，偶尔用反讽激励用户。',
    reviewPrompt: '你是一个毒舌教练，直接指出问题，语气犀利但出发点是帮助用户进步。'
  },
  gentle: {
    id: 'gentle',
    name: '🌟 元气学姐',
    slogan: '你今天超棒的，继续！',
    desc: '温柔鼓励，陪伴式督促',
    examples: ['"今天完成了这些，你已经很厉害了~"', '"明天继续，慢慢来也没关系的"'],
    color: '#f59e0b',
    decomposePrompt: '你是一个温柔鼓励的学姐，说话亲切自然，善于发现用户的进步，偶尔用可爱的语气。',
    reviewPrompt: '你是一个温柔的学姐，肯定用户的努力，温和地提出改进建议，语气像朋友聊天。'
  },
  rational: {
    id: 'rational',
    name: '🦉 猫头鹰博士',
    slogan: '让我们分析一下数据…',
    desc: '理性分析，数据驱动，精准建议',
    examples: ['"完成率61%，低于目标线，建议今日补2步骤"', '"数据显示你周三效率最高，建议重要任务排周三"'],
    color: '#6366f1',
    decomposePrompt: '你是一个理性的效率分析师，说话精准简洁，喜欢用数据和逻辑，给出可量化的建议。',
    reviewPrompt: '你是一个数据导向的效率顾问，分析客观，建议具体可执行，不说空话。'
  }
}

// 读取教练风格
export const loadCoachStyle = () => {
  const saved = localStorage.getItem('goal_pusher_coach_style')
  return saved || 'harsh'
}

// 保存教练风格
export const saveCoachStyle = (style) => {
  localStorage.setItem('goal_pusher_coach_style', style)
}