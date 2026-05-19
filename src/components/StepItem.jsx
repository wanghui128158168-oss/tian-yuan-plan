import { useState } from 'react'
import { Focus, XCircle } from 'lucide-react'
import { getLocalDateStr } from '../utils/dateUtils'

function StepItem({ step, goalId, todayStr, tomorrowStr, onToggleStep, onUpdateGoal, onSelectStep, onDeleteStep, handleStepTextChange }) {
  const [showDatePopover, setShowDatePopover] = useState(false)
  const stepDate = step.scheduledDate ? new Date(step.scheduledDate) : null
  const stepDateLabel = stepDate ? `${stepDate.getMonth() + 1}/${stepDate.getDate()}` : null
  const isOverdue = step.scheduledDate && step.scheduledDate < todayStr && !step.completed
  const isToday = step.scheduledDate === todayStr && !step.completed

  return (
    <div className={`step-item ${step.completed ? 'step-done' : ''} ${isToday ? 'step-today' : ''} ${isOverdue ? 'step-overdue-item' : ''}`}>
      <label className="step-checkbox">
        <input type="checkbox" checked={step.completed} onChange={() => onToggleStep(goalId, step.id)} />
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
                      onUpdateGoal(goalId, (g) => ({ ...g, steps: g.steps.map(s => s.id === step.id ? { ...s, scheduledDate: todayStr } : s) }))
                      setShowDatePopover(false)
                    }}>今天</button>
                    <button onClick={() => {
                      onUpdateGoal(goalId, (g) => ({ ...g, steps: g.steps.map(s => s.id === step.id ? { ...s, scheduledDate: tomorrowStr } : s) }))
                      setShowDatePopover(false)
                    }}>明天</button>
                    <button onClick={() => {
                      const dayAfter = new Date()
                      dayAfter.setDate(dayAfter.getDate() + 2)
                      const dayAfterStr = getLocalDateStr(dayAfter)
                      onUpdateGoal(goalId, (g) => ({ ...g, steps: g.steps.map(s => s.id === step.id ? { ...s, scheduledDate: dayAfterStr } : s) }))
                      setShowDatePopover(false)
                    }}>后天</button>
                  </div>
                  <input
                    type="date"
                    className="step-date-input"
                    value={step.scheduledDate || ''}
                    onChange={(e) => {
                      onUpdateGoal(goalId, (g) => ({ ...g, steps: g.steps.map(s => s.id === step.id ? { ...s, scheduledDate: e.target.value || null } : s) }))
                      setShowDatePopover(false)
                    }}
                  />
                  {step.scheduledDate && (
                    <button className="step-date-clear" onClick={() => {
                      onUpdateGoal(goalId, (g) => ({ ...g, steps: g.steps.map(s => s.id === step.id ? { ...s, scheduledDate: null } : s) }))
                      setShowDatePopover(false)
                    }}>清除排期</button>
                  )}
                </div>
              )}
            </div>
            <button className="step-focus-shortcut" title="开始专注" onClick={(e) => { e.stopPropagation(); onSelectStep(step) }}>
              <Focus size={14} />
            </button>
          </>
        )}
        <button className="delete-step-btn" onClick={() => onDeleteStep(goalId, step.id)} title="删除步骤">
          <XCircle size={16} />
        </button>
      </div>
    </div>
  )
}

export default StepItem
