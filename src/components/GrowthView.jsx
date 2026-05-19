import { useState } from 'react'
import { PLANT_ACHIEVEMENTS, GEM_DATA, RARITY_CONFIG, CUT_COST_POINTS, CUT_COST_ORE } from '../constants'
import { CheckCircle2, Flame, Target } from 'lucide-react'
import { COACH_STYLES, loadCoachStyle } from '../utils/confetti'
import { loadPlantCollection } from '../utils/storage'
import PlantVisual from '../PlantVisual'

function GrowthView({
  goals, todayStr, globalLevel, globalExp, showToast,
  dailyReviewText, setDailyReviewText, handleSaveDailyReview,
  aiComment, handleAIReview, isAIReviewing,
  showRules, setShowRules, setShowShareModal,
  ore, setOre, minePoints, setMinePoints, gems, setGems, currentUser
}) {
  const [growthTab, setGrowthTab] = useState('garden')
  const [cutting, setCutting] = useState(false)
  const [revealGem, setRevealGem] = useState(null)

  const rollGem = () => {
    const rand = Math.random()
    let cumulative = 0
    for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
      cumulative += config.prob
      if (rand <= cumulative) {
        const pool = GEM_DATA[rarity]
        return { ...pool[Math.floor(Math.random() * pool.length)], id: `gem_${Date.now()}`, cutAt: new Date().toISOString() }
      }
    }
    return { ...GEM_DATA.common[0], id: `gem_${Date.now()}`, cutAt: new Date().toISOString() }
  }

  const handleCut = () => {
    if (ore < CUT_COST_ORE) return showToast('原石不足，完成更多步骤吧', 'error')
    if (minePoints < CUT_COST_POINTS) return showToast(`积分不足 ${CUT_COST_POINTS}，继续加油`, 'error')
    setCutting(true)
    setOre(prev => { const v = prev - CUT_COST_ORE; localStorage.setItem('mine_ore', String(v)); return v })
    setMinePoints(prev => { const v = prev - CUT_COST_POINTS; localStorage.setItem('mine_points', String(v)); return v })
    setTimeout(() => {
      const gem = rollGem()
      setGems(prev => { const v = [gem, ...prev]; localStorage.setItem('mine_gems', JSON.stringify(v)); return v })
      setRevealGem(gem)
      setCutting(false)
      if (currentUser) {
        import('../utils/supabase').then(({ upsertGem }) => {
          upsertGem && upsertGem(gem, currentUser.id).catch(console.error)
        })
      }
    }, 1600)
  }

  return (
    <div className="growth-view">
      <div className="growth-subtabs">
        <button className={`growth-subtab ${growthTab === 'garden' ? 'active' : ''}`} onClick={() => setGrowthTab('garden')}>🌿 田园</button>
        <button className={`growth-subtab ${growthTab === 'mine' ? 'active' : ''}`} onClick={() => setGrowthTab('mine')}>⛏️ 矿洞</button>
      </div>

      {growthTab === 'garden' && (
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
      )}

      {growthTab === 'mine' && (
      <div className="mine-view">
        <div className="mine-wallet">
          <div className="wallet-item"><span className="wallet-icon">⛏️</span><span className="wallet-num">{ore}</span><span className="wallet-label">原石</span></div>
          <div className="wallet-item"><span className="wallet-icon">✨</span><span className="wallet-num">{minePoints}</span><span className="wallet-label">积分</span></div>
          <div className="wallet-item"><span className="wallet-icon">💎</span><span className="wallet-num">{gems.length}</span><span className="wallet-label">宝石</span></div>
        </div>

        <div className="cut-zone">
          <div className="cut-ore-display">🪨</div>
          <div className="cut-cost-hint">消耗 {CUT_COST_ORE} 原石 + {CUT_COST_POINTS} 积分</div>
          <div className="cut-prob-hint">普通55% · 精良28% · 稀有12% · 传说4% · 史诗1%</div>
          <button className="cut-btn" onClick={handleCut} disabled={cutting || ore < 1 || minePoints < CUT_COST_POINTS}>
            {cutting ? '切割中...' : '⛏️ 切开原石'}
          </button>
        </div>

        {gems.length > 0 && (
        <div className="mine-section">
          <h3 className="mine-section-title">最近获得</h3>
          <div className="gem-grid">
            {gems.slice(0, 12).map(g => (
              <div key={g.id} className="gem-card" style={{ '--gem-color': RARITY_CONFIG[g.rarity]?.color }}>
                <span className="gem-emoji">{g.emoji}</span>
                <span className="gem-name">{g.name}</span>
                <span className="gem-rarity-label">{RARITY_CONFIG[g.rarity]?.label}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {gems.length === 0 && (
        <div className="mine-empty">完成任务步骤获取原石和积分<br/>来切开你的第一块宝石 🪨</div>
        )}
      </div>
      )}

      {revealGem && (
      <div className="confirm-overlay" onClick={() => setRevealGem(null)}>
        <div className="gem-reveal-modal" onClick={e => e.stopPropagation()}>
          <div className="gem-reveal-emoji">{revealGem.emoji}</div>
          <div className="gem-reveal-name">{revealGem.name}</div>
          <div className="gem-reveal-rarity" style={{ color: RARITY_CONFIG[revealGem.rarity]?.color }}>
            {RARITY_CONFIG[revealGem.rarity]?.label}
          </div>
          <p style={{ color: '#86868B', fontSize: 13, margin: '8px 0 20px' }}>
            {revealGem.rarity === 'epic' ? '🎉 史诗级！极为罕见！' :
             revealGem.rarity === 'legend' ? '✨ 传说级！非常幸运！' :
             revealGem.rarity === 'rare' ? '💫 稀有！继续加油' : '继续完成任务获得更多'}
          </p>
          <button className="gem-reveal-btn" onClick={() => setRevealGem(null)}>收下</button>
        </div>
      </div>
      )}

      {cutting && (
      <div className="confirm-overlay">
        <div className="cutting-overlay">
          <div className="cutting-rock">🪨</div>
          <div className="cutting-hammer">⛏️</div>
          <p style={{ color: '#fff', fontSize: 14, marginTop: 12 }}>正在切割原石...</p>
        </div>
      </div>
      )}
    </div>
  )
}

export default GrowthView
