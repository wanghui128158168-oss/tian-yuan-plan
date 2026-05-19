import { Plus, Settings } from 'lucide-react'
import GoalCard from './GoalCard'
import { quickStartOptions } from '../constants'

function TasksView({
  goals, taskFilter, setTaskFilter, showToast, handleUpdateGoal, handleDeleteGoal,
  handleAddStep, handleToggleStep, handleDeleteStep, handleSelectStep,
  handleRequestNotification, handleAIDecompose, handleCoachReview, addExp,
  todayStr, tomorrowStr, showCompletedGoals, setShowCompletedGoals,
  onOpenDecompose, inCardDecomposeId, setInCardDecomposeId,
  quickTimeframe, setQuickTimeframe, quickBackground, setQuickBackground,
  handleQuickAIDecompose, setQuickGoalPending, setPendingDecomposeGoalId,
  quickGoalText, setQuickGoalText, showQuickContext, setShowQuickContext,
  quickGoalPending, quickStartOffset, setQuickStartOffset, setShowSettingsModal,
  currentUser, setShowAuthModal
}) {
  const filterType = taskFilter
  const activeTasks = goals.filter(g => g.type === filterType && !g.completed)
  const completedTasks = goals.filter(g => g.type === filterType && g.completed)

  return (
    <div className="section tasks-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 className="page-title">我的目标</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              background: currentUser ? '#E8F5EC' : '#1B7A3D',
              color: currentUser ? '#1B7A3D' : 'white',
              border: 'none', borderRadius: 10,
              padding: '6px 14px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            {currentUser ? '已登录' : '登录'}
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettingsModal(true)}
            aria-label="设置"
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: '#F2F2F7',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Settings size={18} strokeWidth={1.8} color="#3A3A3C" />
          </button>
        </div>
      </div>

      <div className="task-filter-bar">
        {[
          { key: 'task', label: '目标', count: goals.filter(g => g.type === 'task' && !g.completed).length },
          { key: 'todo', label: '待办', count: goals.filter(g => g.type === 'todo' && !g.completed).length },
          { key: 'progress', label: '习惯', count: goals.filter(g => g.type === 'progress').length },
        ].map(f => (
          <button key={f.key} className={`task-filter-btn ${taskFilter === f.key ? 'active' : ''}`} onClick={() => setTaskFilter(f.key)}>
            {f.label} {f.count > 0 && <span className="task-filter-count">{f.count}</span>}
          </button>
        ))}
      </div>

      {taskFilter === 'task' && activeTasks.length === 0 && completedTasks.length === 0 && (
        <div className="empty-state-inline">
          <p className="empty-hero">你最近最想做成什么事？</p>
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
            <button className="empty-input-btn" onClick={() => { if (quickGoalText?.trim()) { setQuickGoalPending(quickGoalText.trim()); setQuickGoalText(''); setShowQuickContext(true) } }}>
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
          <button className="quick-start-refresh" onClick={() => setQuickStartOffset(o => (o + 3) % quickStartOptions.length)}>换一批 ↻</button>
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
                onOpenDecompose={onOpenDecompose}
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
          <button className="goals-section-header collapsed" onClick={() => setShowCompletedGoals(!showCompletedGoals)}>
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
    </div>
  )
}

export default TasksView
