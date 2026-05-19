import { useEffect, useRef, useState } from 'react'

function YearPixelWall({ activityData }) {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [])

  const getLocalDateStr = (date = new Date()) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const generateYearDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dates.push(getLocalDateStr(date))
    }

    return dates
  }

  const dates = generateYearDates()

  const getWeekData = () => {
    const weeks = []
    let currentWeek = []

    dates.forEach((dateStr, index) => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()

      if (index === 0) {
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push(null)
        }
      }

      currentWeek.push(dateStr)

      if (dayOfWeek === 6 || index === dates.length - 1) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return weeks
  }

  const weeks = getWeekData()

  const getColor = (count) => {
    if (count === 0) return '#eef2ff'
    if (count === 1) return '#a5b4fc'
    if (count === 2) return '#818cf8'
    if (count === 3) return '#6366f1'
    return '#4338ca'
  }

  const getMonthLabel = (weekIndex) => {
    if (weekIndex === 0) return null

    const currentWeek = weeks[weekIndex]
    const prevWeek = weeks[weekIndex - 1]

    if (!currentWeek || !prevWeek) return null

    const currentDate = currentWeek.find(d => d !== null)
    const prevDate = prevWeek.find(d => d !== null)

    if (!currentDate || !prevDate) return null

    const currentMonth = new Date(currentDate).getMonth()
    const prevMonth = new Date(prevDate).getMonth()

    if (currentMonth !== prevMonth) {
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      return monthNames[currentMonth]
    }

    return null
  }

  const handlePixelClick = (dateStr, event) => {
    const count = activityData[dateStr] || 0
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()

    setTooltip({
      text: `${year}年${month}月${day}日 · 完成 ${count} 件事`,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 40
    })

    setTimeout(() => setTooltip(null), 2000)
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="year-pixel-wall-container" ref={containerRef}>
      <div className="year-pixel-weekday-labels">
        {weekdays.map((day, index) => (
          <div key={index} className="year-pixel-weekday-label">{day}</div>
        ))}
      </div>
      <div className="year-pixel-weeks">
        {weeks.map((week, weekIndex) => {
          const monthLabel = getMonthLabel(weekIndex)
          
          return (
            <div key={weekIndex} className="year-pixel-week">
              {monthLabel && (
                <div className="year-pixel-month-label">{monthLabel}</div>
              )}
              <div className="year-pixel-week-days">
                {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                  const dateStr = week[dayIndex]
                  
                  if (!dateStr) {
                    return (
                      <div
                        key={dayIndex}
                        className="year-pixel year-pixel-empty"
                      />
                    )
                  }

                  const count = activityData[dateStr] || 0
                  const color = getColor(count)

                  return (
                    <div
                      key={dayIndex}
                      className="year-pixel"
                      style={{ background: color }}
                      onClick={(e) => handlePixelClick(dateStr, e)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {tooltip && (
        <div
          className="year-pixel-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

export default YearPixelWall
