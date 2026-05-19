import { useState } from 'react'
import { Trash2, Plus, Bell, Edit3, Activity } from 'lucide-react'
import { COACH_STYLES, loadCoachStyle } from '../utils/confetti'
import { computeProgressStats } from '../utils/dateUtils'
import StepItem from './StepItem'

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

  const openReminderModal = () => {
    setReminderTime(goal.reminderTime || '20:00')
    setShowReminderModal(true)
  }

  const closeReminderModal = () => {
    setReminderTime('20:00')
    setShowReminderModal(false)
  }

  const handleAddStep = () => {
    setShowAddStepInput(true)
    setAddStepText('')
  }

  const handleConfirmAddStep = () => {
    if (addStepText.trim()) onAddStep(goal.id, addStepText.trim())
    setShowAddStepInput(false)
    setAddStepText('')
  }

  const handleCancelAddStep = () => {
    setShowAddStepInput(false)
    setAddStepText('')
  }

  const handleAddStepKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirmAddStep()
    else if (e.key === 'Escape') handleCancelAddStep()
  }

  const handleStepTextChange = (stepId, newText) => {
    onUpdateGoal(goal.id, (g) => ({
      ...g,
      steps: g.steps.map((s) => (s.id === stepId ? { ...s, text: newText } : s)),
    }))
  }

  const handleSaveReminder = async () => {
    const permissionGranted = await onRequestNotification()
    if (permissionGranted) {
      onUpdateGoal(goal.id, (g) => {
        const updatedGoal = JSON.parse(JSON.stringify(g))
        updatedGoal.reminderTime = reminderTime
        return updatedGoal
      })
      closeReminderModal()
    } else {
      showToast('请先允许浏览器通知权限，否则无法接收提醒', 'error')
    }
  }

  const handleRemoveReminder = () => {
    onUpdateGoal(goal.id, (g) => {
      const updatedGoal = JSON.parse(JSON.stringify(g))
      updatedGoal.reminderTime = null
      return updatedGoal
    })
  }

  return (
    <div className={`goal-card ${goal.completed ? 'completed' : ''}`}>
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

      {isExpanded && (
        <div className="goal-card-body">
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
                    handleStepTextChange={handleStepTextChange}
                  />
                ))}
              </div>
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
              <button className="notes-btn" onClick={() => setShowNotes(!showNotes)}>
                <Edit3 size={14} /> 笔记
              </button>
            </div>
          )}

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

      {showReminderModal && (
        <div className="reminder-overlay" onClick={closeReminderModal}>
          <div className="reminder-modal" onClick={(e) => e.stopPropagation()}>
            <button className="reminder-close" onClick={closeReminderModal}>×</button>
            <h3>设置提醒</h3>
            <p className="reminder-hint">选择每天提醒你的时间</p>
            <div className="reminder-time-picker">
              <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="time-input" />
            </div>
            <div className="reminder-controls">
              {goal.reminderTime && (
                <button className="reminder-btn-remove" onClick={handleRemoveReminder}>关闭提醒</button>
              )}
              <button className="reminder-btn-save" onClick={handleSaveReminder}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalCard
