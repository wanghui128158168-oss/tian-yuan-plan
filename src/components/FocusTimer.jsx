import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import GrowingTree from '../GrowingTree'

function FocusTimer({ selectedStep, onClose, onRecordActivity, onHabitComplete }) {
  const [minutes, setMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isWhiteNoiseOn, setIsWhiteNoiseOn] = useState(false)
  const [isMiniStart, setIsMiniStart] = useState(false)
  const [showDecision, setShowDecision] = useState(false)
  const [abandoned, setAbandoned] = useState(false)

  const totalSeconds = minutes * 60
  const progress = (totalSeconds - timeLeft) / totalSeconds

  const audioContextRef = useRef(null)
  const noiseNodeRef = useRef(null)
  const gainNodeRef = useRef(null)

  const createWhiteNoise = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const audioContext = audioContextRef.current
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    const whiteNoise = audioContext.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true
    const filter = audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.1
    whiteNoise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(audioContext.destination)
    noiseNodeRef.current = whiteNoise
    gainNodeRef.current = gainNode
    whiteNoise.start()
  }

  const stopWhiteNoise = () => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop()
      noiseNodeRef.current = null
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect()
      gainNodeRef.current = null
    }
  }

  const toggleWhiteNoise = () => {
    if (isWhiteNoiseOn) {
      stopWhiteNoise()
      setIsWhiteNoiseOn(false)
    } else {
      createWhiteNoise()
      setIsWhiteNoiseOn(true)
    }
  }

  useEffect(() => {
    return () => {
      stopWhiteNoise()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          if (isMiniStart && !showDecision) {
            setShowDecision(true)
          } else {
            setIsFinished(true)
            stopWhiteNoise()
            if (onRecordActivity) onRecordActivity()
            if (selectedStep.isHabit && onHabitComplete) onHabitComplete(selectedStep)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, timeLeft, isMiniStart, showDecision, onRecordActivity])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setTimeLeft(minutes * 60)
    setIsRunning(false)
    setIsFinished(false)
    setIsMiniStart(false)
    setShowDecision(false)
    setAbandoned(false)
  }

  const handleMiniStart = () => {
    setMinutes(5)
    setTimeLeft(5 * 60)
    setIsMiniStart(true)
    setShowDecision(false)
    setIsRunning(true)
  }

  const handleContinue = () => {
    setMinutes(20)
    setTimeLeft(20 * 60)
    setShowDecision(false)
    setIsRunning(true)
  }

  const handleFinish = () => {
    if (onRecordActivity) onRecordActivity()
    setIsFinished(true)
    setShowDecision(false)
    stopWhiteNoise()
  }

  const handleAbandon = () => {
    setIsRunning(false)
    stopWhiteNoise()
    setAbandoned(true)
    setTimeout(() => { onClose() }, 2000)
  }

  const handleMinutesChange = (delta) => {
    const newMinutes = Math.max(1, Math.min(120, minutes + delta))
    setMinutes(newMinutes)
    if (!isRunning && !showDecision) {
      setTimeLeft(newMinutes * 60)
      setIsFinished(false)
    }
  }

  const handleClose = () => {
    if (isRunning) {
      if (window.confirm('确定放弃本次专注吗？')) {
        setIsRunning(false)
        stopWhiteNoise()
        setAbandoned(true)
        setTimeout(() => { onClose() }, 2000)
      }
    } else {
      onClose()
    }
  }

  if (!selectedStep || !selectedStep.id || !selectedStep.text) return null

  return (
    <div className="focus-timer-overlay" onClick={onClose}>
      <div className="focus-timmer-container" onClick={(e) => e.stopPropagation()}>
        <button className="focus-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
        <p className="focus-step-name">{selectedStep.text}</p>
        <div className="focus-tree-area">
          <GrowingTree progress={progress} abandoned={abandoned} />
        </div>
        <span className={`focus-time ${isFinished ? 'focus-finished' : ''}`}>
          {formatTime(timeLeft)}
        </span>
        {showDecision ? (
          <div className="focus-decision-state">
            <div className="decision-icon">🔥</div>
            <p className="decision-title">最难的启动已完成</p>
            <p className="decision-subtitle">要顺势继续吗？</p>
            <div className="decision-buttons">
              <button className="decision-btn decision-continue" onClick={handleContinue}>➡️ 继续 20 分钟</button>
              <button className="decision-btn decision-finish" onClick={handleFinish}>✅ 见好就收</button>
            </div>
          </div>
        ) : isFinished ? (
          <div className="focus-complete-alert">🎉 完成！休息一下吧~</div>
        ) : abandoned ? null : (
          <>
            <div className="focus-main-action">
              {isRunning ? (
                <button onClick={handlePause} className="focus-main-btn pause">⏸ 暂停</button>
              ) : (
                <button onClick={handleStart} className="focus-main-btn start">▶ 开始专注</button>
              )}
            </div>
            <div className="focus-time-adjust">
              <button onClick={() => handleMinutesChange(-5)}>−5</button>
              <span>{minutes} 分钟</span>
              <button onClick={() => handleMinutesChange(+5)}>+5</button>
            </div>
            <div className="focus-secondary-row">
              <button onClick={handleMiniStart} className="focus-secondary-btn">⚡ 先做5分钟</button>
              <button
                className={`focus-secondary-btn ${isWhiteNoiseOn ? 'active' : ''}`}
                onClick={toggleWhiteNoise}
              >
                🎧 {isWhiteNoiseOn ? '关闭' : '白噪音'}
              </button>
            </div>
            {isRunning && (
              <button onClick={handleAbandon} className="focus-abandon-btn">放弃</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FocusTimer
