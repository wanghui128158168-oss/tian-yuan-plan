import { PLANT_ACHIEVEMENTS } from '../constants'
import { CheckCircle2, Flame, Target } from 'lucide-react'
import { COACH_STYLES, loadCoachStyle } from '../utils/confetti'
import { loadPlantCollection } from '../utils/storage'
import PlantVisual from '../PlantVisual'

function GrowthView({
  goals, todayStr, globalLevel, globalExp, showToast,
  dailyReviewText, setDailyReviewText, handleSaveDailyReview,
  aiComment, handleAIReview, isAIReviewing,
  showRules, setShowRules, setShowShareModal
}) {
  return (
    <div className="section growth-section">
      {(() => {
        const myCollection = loadPlantCollection()
        const completedStepsCount = goals.flatMap(g => g.steps||[]).filter(s => s.completed).length
        const treeProgress = Math.min(1, completedStepsCount / 50)
        const plantStage = treeProgress < 0.1 ? 0 : treeProgress < 0.25 ? 1 : treeProgress < 0.5 ? 2 : treeProgress < 0.7 ? 3 : treeProgress < 0.9 ? 4 : 5
        const plantPositions = [
          { left: '12%', bottom: '8%', size: 38, z: 4 },
          { left: '32%', bottom: '6%', size: 42, z: 4 },
          { left: '54%', bottom: '9%', size: 38, z: 4 },
          { left: '76%', bottom: '5%', size: 40, z: 4 },
          { left: '6%', bottom: '28%', size: 28, z: 3 },
          { left: '22%', bottom: '32%', size: 26, z: 3 },
          { left: '42%', bottom: '30%', size: 30, z: 3 },
          { left: '62%', bottom: '34%', size: 26, z: 3 },
          { left: '82%', bottom: '28%', size: 28, z: 3 },
          { left: '15%', bottom: '50%', size: 22, z: 2 },
          { left: '35%', bottom: '52%', size: 20, z: 2 },
          { left: '55%', bottom: '50%', size: 22, z: 2 },
          { left: '72%', bottom: '54%', size: 20, z: 2 },
          { left: '10%', bottom: '66%', size: 18, z: 1 },
          { left: '28%', bottom: '68%', size: 16, z: 1 },
          { left: '48%', bottom: '66%', size: 18, z: 1 },
          { left: '68%', bottom: '68%', size: 16, z: 1 },
          { left: '85%', bottom: '64%', size: 18, z: 1 },
          { left: '40%', bottom: '78%', size: 14, z: 1 },
          { left: '60%', bottom: '76%', size: 14, z: 1 },
        ]
        return (
          <div className="garden-card">
            <div className="garden-scene">
              {myCollection.length === 0 ? (
                <div className="garden-empty">
                  <PlantVisual stage={plantStage} size={150} health="thriving" />
                  <div className="garden-empty-text">
                    <p className="garden-empty-title">你的田园还是空的</p>
                    <p className="garden-empty-sub">完成第一个任务，就能收获你的第一株作物</p>
                  </div>
                </div>
              ) : (
                myCollection.map((plant, i) => {
                  const pos = plantPositions[i % plantPositions.length]
                  return (
                    <span key={plant.id} className="garden-plant-item" style={{left:pos.left,bottom:pos.bottom,fontSize:`${pos.size}px`,zIndex:pos.z,animationDelay:`${i*0.12}s`}} title={`${plant.name}·${plant.unlockedAt}`}>{plant.emoji}</span>
                  )
                })
              )}
              <div className="garden-grass"></div>
            </div>
            <div className="garden-info">
              <div className="garden-info-top">
                <span className="garden-level-badge">
                  Lv.{globalLevel} · {
                    globalLevel <= 2 ? '🌱 新农夫' :
                    globalLevel <= 5 ? '🌿 见习园丁' :
                    globalLevel <= 10 ? '🌻 田园达人' :
                    globalLevel <= 18 ? '🎋 资深农夫' : '🌳 田园大师'
                  }
                </span>
                <span className="garden-collection-count">🌾 {myCollection.length} / {PLANT_ACHIEVEMENTS.length}</span>
              </div>
              <div className="garden-exp-bar">
                <div className="garden-exp-fill" style={{ width: `${globalExp % 100}%` }}/>
              </div>
              <span className="garden-exp-text">{globalExp % 100} / 100 EXP · 还需 {100 - (globalExp % 100)} 升级</span>
            </div>
          </div>
        )
      })()}

      <button className="share-garden-btn" onClick={() => setShowShareModal(true)}>🌾 分享我的田园</button>

      <div className="growth-today-stats">
        {[
          { icon: <CheckCircle2 size={20} color="#1B7A3D" />, num: goals.flatMap(g => g.steps||[]).filter(s => s.completed && s.scheduledDate === todayStr).length, label: '今日步骤' },
          { icon: <Flame size={20} color="#1B7A3D" />, num: goals.filter(g => g.type==='progress').filter(g => { const log=g.progressLog?.[todayStr]||0; return g.habitType==='checkin'?log>=1:log>=(g.dailyTarget||1) }).length, label: '习惯打卡' },
          { icon: <Target size={20} color="#1B7A3D" />, num: goals.filter(g => g.type==='task'&&!g.completed).length, label: '目标进行' }
        ].map(item => (
          <div key={item.label} className="growth-today-stat">
            <span className="growth-today-icon">{item.icon}</span>
            <span className="growth-today-num">{item.num}</span>
            <span className="growth-today-label">{item.label}</span>
          </div>
        ))}
      </div>

      {(() => {
        const collection = loadPlantCollection()
        const unlockedIds = collection.map(p => p.id)
        return (
          <div className="plant-collection-section">
            <div className="plant-collection-header">
              <span className="plant-collection-title">🌾 田园图鉴</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span className="plant-collection-count">{unlockedIds.length}/{PLANT_ACHIEVEMENTS.length}</span>
                <button className="plant-rules-btn" onClick={() => setShowRules(!showRules)}>{showRules ? '收起' : '？解锁条件'}</button>
              </div>
            </div>
            {showRules && (
              <div className="plant-rules-panel">
                {PLANT_ACHIEVEMENTS.map(p => {
                  const unlocked = unlockedIds.includes(p.id)
                  return (
                    <div key={p.id} className={`plant-rule-item ${unlocked?'unlocked':''}`}>
                      <span className="plant-rule-emoji">{unlocked?p.emoji:'🔒'}</span>
                      <div className="plant-rule-info">
                        <span className="plant-rule-name">{unlocked?p.name:'???'}</span>
                        <span className="plant-rule-desc">{p.desc}</span>
                      </div>
                      {unlocked && <span className="plant-rule-check">✓</span>}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="plant-collection-grid">
              {PLANT_ACHIEVEMENTS.map(plant => {
                const unlocked = unlockedIds.includes(plant.id)
                const info = collection.find(p => p.id === plant.id)
                return (
                  <div key={plant.id} className={`plant-collection-item ${unlocked?'unlocked':'locked'}`}>
                    <span className="plant-collection-emoji">{unlocked?plant.emoji:'🔒'}</span>
                    <span className="plant-collection-name">{unlocked?plant.name:'???'}</span>
                    {unlocked && <span className="plant-collection-date">{info?.unlockedAt?.slice(5)}</span>}
                  </div>
                )
              })}
            </div>
            {unlockedIds.length===0 && <p className="plant-collection-hint">完成第一个任务，解锁你的第一棵植物 🌱</p>}
          </div>
        )
      })()}

      <div className="daily-review-section">
        <h3 className="daily-review-title">✍️ 今日手账 <span className="daily-review-optional">选填</span></h3>
        <textarea
          className="daily-review-textarea"
          placeholder="记录今天的困难、心情、想法...（不写也能 AI 点评）"
          value={dailyReviewText}
          onChange={(e) => setDailyReviewText(e.target.value)}
          onBlur={handleSaveDailyReview}
        />
        <button className="ai-review-btn" onClick={handleAIReview} disabled={isAIReviewing}>
          {isAIReviewing ? 'AI 思考中...' : '✨ 获取今日教练点评'}
        </button>
        {aiComment && (() => {
          const _cs = COACH_STYLES[loadCoachStyle()] || COACH_STYLES.gentle
          return (
            <div className="ai-comment-card" style={{borderLeftColor: _cs.color}}>
              <div className="ai-comment-header">
                <span className="coach-name-tag" style={{background: _cs.color + '18', color: _cs.color}}>{_cs.name}</span>
                <span className="coach-tag-label">今日点评</span>
              </div>
              <div className="ai-comment-text">{aiComment}</div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default GrowthView
