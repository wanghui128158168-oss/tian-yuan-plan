import { useState } from 'react'
import PlantVisual from './PlantVisual'
import { COACH_STYLES, saveCoachStyle } from './utils/confetti'
import './Onboarding.css'

const ONBOARD_KEY = 'garden_onboarded'

/* ─── 幻灯片内容定义 ─── */
function Slide1() {
  return (
    <div className="ob-step">
      <div className="ob-logo">
        <PlantVisual stage={2} size={100} health="growing" />
      </div>
      <div className="ob-tag">田园计划</div>
      <h2 className="ob-title">想做的事很多<br/>却不知道从哪开始？</h2>
      <p className="ob-desc">计划写了一张又一张<br/>第一步却总是迟迟不敢走</p>
    </div>
  )
}

function Slide2() {
  return (
    <div className="ob-step">
      <div className="ob-demo">
        <div className="ob-demo-input">
          <span className="ob-demo-label">🎯 我想做的事</span>
          <span className="ob-demo-value">备考英语六级</span>
        </div>
        <div className="ob-demo-arrow">✨ AI 拆解成今天能做的步骤</div>
        <div className="ob-demo-results">
          <div className="ob-demo-item"><span className="ob-check">✓</span>今天：下载历年真题做一套</div>
          <div className="ob-demo-item"><span className="ob-check">✓</span>明天：分析错题找薄弱点</div>
          <div className="ob-demo-item"><span className="ob-check">✓</span>后天：制定每日词汇计划</div>
        </div>
      </div>
      <h2 className="ob-title">说出你想做的事</h2>
      <p className="ob-desc">AI 帮你拆成今天能开始的第一步<br/>再大的目标也能动起来</p>
    </div>
  )
}

function Slide3() {
  return (
    <div className="ob-step">
      <div className="ob-plant-row">
        <div className="ob-plant-item">
          <PlantVisual stage={0} size={50} health="growing" />
          <span className="ob-plant-label">开始时</span>
        </div>
        <div className="ob-plant-arrow">→</div>
        <div className="ob-plant-item">
          <PlantVisual stage={5} size={85} health="thriving" />
          <span className="ob-plant-label">坚持后</span>
        </div>
      </div>
      <h2 className="ob-title">做得越多<br/>田园越丰盛</h2>
      <p className="ob-desc">每完成一步，小树就会成长<br/>解锁果实、花朵和隐藏惊喜</p>
      <div className="ob-badges">
        <span>🌱</span><span>🌸</span><span>🌻</span>
        <span className="ob-badge-locked">🔒</span>
        <span className="ob-badge-locked">🔒</span>
      </div>
    </div>
  )
}

function Slide4({ selected, onSelect }) {
  const styles = COACH_STYLES || {}
  return (
    <div className="ob-step ob-step-scroll">
      <h2 className="ob-title" style={{ marginBottom: 6 }}>选择你的规划风格</h2>
      <p className="ob-desc" style={{ marginBottom: 20 }}>影响 AI 反馈的方式，随时可在设置里换</p>
      <div className="ob-coach-list">
        {Object.entries(styles).map(([key, style]) => (
          <button
            key={key}
            className={`ob-coach-card ${selected === key ? 'ob-coach-active' : ''}`}
            style={selected === key ? { borderColor: style.color, background: style.color + '15' } : {}}
            onClick={() => onSelect(key)}
          >
            <div className="ob-coach-top">
              <span className="ob-coach-name" style={selected === key ? { color: style.color } : {}}>
                {style.name}
              </span>
              {selected === key && (
                <span className="ob-coach-check" style={{ background: style.color }}>✓</span>
              )}
            </div>
            <p className="ob-coach-slogan">"{style.slogan}"</p>
            <span className="ob-coach-eg">{style.examples?.[0]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── 主组件 ─── */
const TOTAL = 4  // 4 张幻灯片

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [coach, setCoach] = useState('gentle')
  const [dir, setDir] = useState(1)  // 1=向前 -1=向后

  const goTo = (next) => {
    if (next < 0 || next > TOTAL - 1) return
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const handleNext = () => {
    if (step < TOTAL - 1) {
      goTo(step + 1)
    } else {
      try { saveCoachStyle(coach) } catch (e) { /* ignore */ }
      localStorage.setItem(ONBOARD_KEY, 'true')
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem(ONBOARD_KEY, 'true')
    onComplete()
  }

  /* 触摸滑动 */
  let tx = 0, ty = 0
  const onTouchStart = (e) => {
    tx = e.touches[0].clientX
    ty = e.touches[0].clientY
  }
  const onTouchEnd = (e) => {
    const dx = tx - e.changedTouches[0].clientX
    const dy = Math.abs(ty - e.changedTouches[0].clientY)
    if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return  // 太短或是竖滑
    if (dx > 0 && step < TOTAL - 1) goTo(step + 1)
    if (dx < 0 && step > 0) goTo(step - 1)
  }

  const btnLabel =
    step === TOTAL - 1 ? '出发，开始我的计划 →' :
    step === TOTAL - 2 ? '选择规划风格 →' :
    '下一步'

  const slides = [
    <Slide1 />,
    <Slide2 />,
    <Slide3 />,
    <Slide4 selected={coach} onSelect={setCoach} />,
  ]

  return (
    <div className="ob-overlay" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button className="ob-skip" onClick={handleSkip}>跳过</button>

      {/* 幻灯片区域：每张用 absolute 定位，只有 active 可见 */}
      <div className="ob-stage">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`ob-slide ${i === step ? 'ob-slide-active' : i < step ? 'ob-slide-past' : 'ob-slide-future'}`}
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="ob-footer">
        <div className="ob-dots">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span
              key={i}
              className={`ob-dot ${i === step ? 'ob-dot-active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button className="ob-btn" onClick={handleNext}>{btnLabel}</button>
      </div>
    </div>
  )
}
