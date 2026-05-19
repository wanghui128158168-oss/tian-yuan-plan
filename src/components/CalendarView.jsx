import { Focus, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import { TASK_COLORS } from '../constants'
import { getLocalDateStr, formatDateLabel, getWeekDays, getMonthDays, computeProgressStats } from '../utils/dateUtils'
import { loadCoachStyle } from '../utils/confetti'

function CalendarView({
  goals, calendarView, setCalendarView, selectedDate, setSelectedDate,
  currentMonth, setCurrentMonth, currentWeekStart, setCurrentWeekStart,
  todayStr, coachStyle, showToast, handleSelectStep, handleCheckinHabit,
  handleOpenRecordModal, handleOpenTimeSheet, handleToggleStep, showConfirm,
  setGoals, setIsFocusActive, setSelectedStep, globalLevel, globalExp
}) {
  return (
    <div className="calendar-section">
      <div className="mini-growth-bar">
        <span className="mini-growth-level">Lv.{globalLevel}</span>
        <div className="mini-growth-track">
          <div className="mini-growth-fill" style={{ width: `${globalExp % 100}%` }} />
        </div>
        <span className="mini-growth-exp">{globalExp % 100}/100</span>
      </div>
      <div className="calendar-view-tabs">
        <button className={`calendar-view-tab ${calendarView === 'week' ? 'active' : ''}`} onClick={() => setCalendarView('week')}>周</button>
        <button className={`calendar-view-tab ${calendarView === 'day' ? 'active' : ''}`} onClick={() => setCalendarView('day')}>日</button>
        <button className={`calendar-view-tab ${calendarView === 'month' ? 'active' : ''}`} onClick={() => setCalendarView('month')}>月</button>
      </div>

      {calendarView === 'week' && (
        <>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={() => { const c = new Date(currentWeekStart); c.setDate(c.getDate() - 7); setCurrentWeekStart(getLocalDateStr(c)) }}>
              <ChevronLeft size={20} />
            </button>
            <span className="calendar-nav-title">
              {(() => { const wd = getWeekDays(currentWeekStart); const ws = new Date(wd[0]); const we = new Date(wd[6]); const sm = ws.getMonth()+1; const em = we.getMonth()+1; const sd = ws.getDate(); const ed = we.getDate(); return sm===em ? `${sm}月${sd} - ${ed}日` : `${sm}月${sd}日 - ${em}月${ed}日` })()}
            </span>
            <button className="calendar-nav-btn" onClick={() => { const c = new Date(currentWeekStart); c.setDate(c.getDate() + 7); setCurrentWeekStart(getLocalDateStr(c)) }}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="calendar-week-grid">
            {getWeekDays(currentWeekStart).map((dateStr) => {
              const { month, day, weekday } = formatDateLabel(dateStr)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const todosOnDate = goals.filter(g => g.type === 'todo' && !g.completed && g.dueDate === dateStr)
              const stepsOnDate = goals.filter(g => g.type === 'task').flatMap(g => g.steps.filter(s => s.scheduledDate === dateStr && !s.completed).map(s => ({ ...s, goalName: g.name, goalId: g.id })))
              const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(dateStr))
              const allItems = [...todosOnDate.map(t => ({ type: 'todo', item: t })), ...stepsOnDate.map(s => ({ type: 'task', item: s })), ...habitsOnDate.map(h => ({ type: 'progress', item: h }))]
              const colorDots = allItems.slice(0, 3).map(({ type, item }) => ({ color: TASK_COLORS[type], hasTime: !!(item.scheduledTime) }))
              const extraCount = allItems.length > 3 ? allItems.length - 3 : 0
              return (
                <div key={dateStr} className={`calendar-week-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(dateStr)}>
                  <div className="calendar-weekday-label">{weekday}</div>
                  <div className={`calendar-date-number ${isToday ? 'today' : ''}`}>{day}</div>
                  <div className="calendar-color-dots">
                    {colorDots.map((dot, idx) => (
                      extraCount > 0 && idx === 2 ? <span key={idx} className="calendar-dot-extra">+{extraCount}</span> : <span key={idx} className={`calendar-dot ${dot.hasTime ? '' : 'hollow'}`} style={dot.hasTime ? { background: dot.color } : { borderColor: dot.color }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {calendarView === 'day' && (
        <>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={() => { const c = new Date(selectedDate); c.setDate(c.getDate() - 1); setSelectedDate(getLocalDateStr(c)) }}>
              <ChevronLeft size={20} />
            </button>
            <span className="calendar-nav-title">{formatDateLabel(selectedDate).full}</span>
            <button className="calendar-nav-btn" onClick={() => { const c = new Date(selectedDate); c.setDate(c.getDate() + 1); setSelectedDate(getLocalDateStr(c)) }}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="calendar-day-timeline">
            {(() => {
              const todosOnDate = goals.filter(g => g.type === 'todo' && !g.completed && g.dueDate === selectedDate)
              const stepsOnDate = goals.filter(g => g.type === 'task').flatMap(g => g.steps.filter(s => s.scheduledDate === selectedDate && !s.completed).map(s => ({ ...s, goalName: g.name, goalId: g.id })))
              const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(selectedDate))
              const scheduledItems = [...todosOnDate.filter(t => t.scheduledTime).map(t => ({ type: 'todo', item: t, time: t.scheduledTime })), ...stepsOnDate.filter(s => s.scheduledTime).map(s => ({ type: 'task', item: s, time: s.scheduledTime })), ...habitsOnDate.filter(h => h.scheduledTime).map(h => ({ type: 'progress', item: h, time: h.scheduledTime }))].sort((a, b) => a.time.localeCompare(b.time))
              const unscheduledItems = [...todosOnDate.filter(t => !t.scheduledTime).map(t => ({ type: 'todo', item: t })), ...stepsOnDate.filter(s => !s.scheduledTime).map(s => ({ type: 'task', item: s })), ...habitsOnDate.filter(h => !h.scheduledTime).map(h => ({ type: 'progress', item: h }))]
              const hours = []; for (let h = 6; h <= 23; h++) hours.push(`${h.toString().padStart(2, '0')}:00`)
              return (
                <>
                  {unscheduledItems.length > 0 && (
                    <div className="calendar-unscheduled">
                      <div className="calendar-unscheduled-label">未安排</div>
                      <div className="calendar-unscheduled-items">
                        {unscheduledItems.map(({ type, item }) => (
                          <div key={item.id} className="calendar-task-block" style={{ borderLeftColor: TASK_COLORS[type], background: `${TASK_COLORS[type]}10` }} onClick={() => handleOpenTimeSheet(item, type)}>
                            <span className="calendar-task-name">{item.name || item.text}</span>
                            <span className="calendar-task-schedule-btn">+ 安排时间</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="calendar-timeline">
                    {hours.map((hour) => {
                      const itemsAtHour = scheduledItems.filter(({ time }) => time && time.startsWith(hour.split(':')[0]))
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
                                <div key={item.id} className="calendar-task-block scheduled" style={{ borderLeftColor: TASK_COLORS[type], background: `${TASK_COLORS[type]}14`, height: `${height}px`, minHeight: '40px' }} onClick={() => handleOpenTimeSheet(item, type)}>
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

      {calendarView === 'month' && (
        <>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={() => setCurrentMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })}>
              <ChevronLeft size={20} />
            </button>
            <span className="calendar-nav-title">{currentMonth.year}年{currentMonth.month + 1}月</span>
            <button className="calendar-nav-btn" onClick={() => setCurrentMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="calendar-month-grid">
            <div className="calendar-month-header">
              {['一', '二', '三', '四', '五', '六', '日'].map((d) => <div key={d} className="calendar-month-header-cell">{d}</div>)}
            </div>
            <div className="calendar-month-body">
              {getMonthDays(currentMonth.year, currentMonth.month).map((dateStr, idx) => {
                if (!dateStr) return <div key={idx} className="calendar-month-cell empty" />
                const { day } = formatDateLabel(dateStr)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const todosOnDate = goals.filter(g => g.type === 'todo' && !g.completed && g.dueDate === dateStr)
                const stepsOnDate = goals.filter(g => g.type === 'task').flatMap(g => g.steps.filter(s => s.scheduledDate === dateStr && !s.completed))
                const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(dateStr))
                const allItems = [...todosOnDate.map(t => ({ type: 'todo' })), ...stepsOnDate.map(s => ({ type: 'task' })), ...habitsOnDate.map(h => ({ type: 'progress' }))]
                const colorDots = allItems.slice(0, 3).map(({ type }) => TASK_COLORS[type])
                const extraCount = allItems.length > 3 ? allItems.length - 3 : 0
                return (
                  <div key={idx} className={`calendar-month-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => { setSelectedDate(dateStr); setCalendarView('week') }}>
                    <div className={`calendar-month-date ${isToday ? 'today' : ''}`}>{day}</div>
                    <div className="calendar-month-dots">
                      {colorDots.map((color, idx) => (
                        extraCount > 0 && idx === 2 ? <span key={idx} className="calendar-dot-extra">+{extraCount}</span> : <span key={idx} className="calendar-dot" style={{ background: color }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {(calendarView === 'week' || calendarView === 'month') && (
        <div className="calendar-task-panel">
          {(() => {
            const { month, day } = formatDateLabel(selectedDate)
            const todosOnDate = goals.filter(g => g.type === 'todo' && !g.completed && (g.dueDate === null || g.dueDate === undefined || g.dueDate === selectedDate))
            const stepsOnDate = goals.filter(g => g.type === 'task').flatMap(g => g.steps.filter(s => s.scheduledDate === selectedDate && !s.completed).map(s => ({ ...s, goalName: g.name, goalId: g.id })))
            const habitsOnDate = goals.filter(g => g.type === 'progress' && !(g.skippedDates || []).includes(selectedDate || todayStr))
            const totalCount = todosOnDate.length + stepsOnDate.length + habitsOnDate.length
            return (
              <>
                <div className="calendar-task-panel-header">
                  <h3 className="calendar-task-panel-title">{month}月{day}日 · {totalCount}件待完成</h3>
                  <button className="calendar-task-panel-link" onClick={() => setCalendarView('day')}>查看时间轴 ›</button>
                  <button className="relax-today-btn" onClick={() => showConfirm({ title: '今日放纵', subtitle: '清空今天所有计划', confirmText: '放纵！' }, () => {
                    setGoals(prev => prev.map(g => {
                      if (g.type === 'todo' && g.dueDate === todayStr) return null
                      if (g.type === 'task') return { ...g, steps: g.steps.map(s => s.scheduledDate === todayStr ? { ...s, scheduledDate: null } : s) }
                      if (g.type === 'progress') { const newLog = { ...g.progressLog }; delete newLog[todayStr]; const skipped = [...(g.skippedDates || []), todayStr]; return { ...g, progressLog: newLog, skippedDates: skipped } }
                      return g
                    }).filter(Boolean))
                    showToast('去好好休息吧 🛋️', 'info')
                  })}>今日放纵</button>
                </div>
                {totalCount === 0 ? (
                  <div className="calendar-task-empty">
                    <p style={{color: '#86868B', fontSize: 14}}>暂无安排</p>
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
                          <div key={todo.id} className="calendar-task-item">
                            <div className="calendar-task-item-color" style={{ background: TASK_COLORS.todo }} />
                            <div className="calendar-task-item-content">
                              <span className="calendar-task-item-name">{todo.name}</span>
                            </div>
                            <div className="calendar-task-item-actions">
                              <button className="calendar-task-item-btn focus" onClick={() => { setSelectedStep({ id: todo.id, text: todo.name }); setIsFocusActive(true) }}>
                                <Focus size={16} />
                              </button>
                              <button className="calendar-task-item-btn" onClick={() => {
                                setGoals(prev => prev.filter(g => g.id !== todo.id))
                                import('canvas-confetti').then((m) => m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 }))
                                showToast('✅ 待办已完成', 'success')
                              }}>
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
                            <div key={habit.id} className="calendar-task-item">
                              <div className="calendar-task-item-color" style={{ background: TASK_COLORS.progress }} />
                              <div className="calendar-task-item-content">
                                <span className="calendar-task-item-name">{habit.name}</span>
                                <span className="calendar-task-item-sub">{stats.currentStreak > 0 ? `连续 ${stats.currentStreak} 天` : `累计 ${stats.totalAchievedDays} 天`}</span>
                              </div>
                              <div className="calendar-task-item-actions">
                                <button className="calendar-task-item-btn focus" onClick={() => handleSelectStep({ id: `habit-${habit.id}`, text: habit.name, completed: false, isHabit: true, goalId: habit.id, habitType: habit.habitType, habit })}>
                                  <Focus size={16} />
                                </button>
                                {isCheckin ? (
                                  <button className={`calendar-task-item-btn ${isCompleted ? 'completed' : ''}`} onClick={() => handleCheckinHabit(habit.id)}>
                                    {isCompleted ? '✓' : <Circle size={20} />}
                                  </button>
                                ) : (
                                  <button className="calendar-task-item-btn record" onClick={() => handleOpenRecordModal(habit)}>记录</button>
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
                          <div key={step.id} className="calendar-task-item">
                            <div className="calendar-task-item-color" style={{ background: TASK_COLORS.task }} />
                            <div className="calendar-task-item-content">
                              <span className="calendar-task-item-name">{step.text}</span>
                              <span className="calendar-task-item-sub">来自：{step.goalName}</span>
                            </div>
                            <div className="calendar-task-item-actions">
                              <button className="calendar-task-item-btn focus" onClick={() => handleSelectStep({ id: step.id, text: step.text, completed: false })}>
                                <Focus size={16} />
                              </button>
                              <button className="calendar-task-item-btn complete" onClick={() => { handleToggleStep(step.goalId, step.id); showToast('✅ 步骤完成！', 'success') }}>
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
  )
}

export default CalendarView
