import './PlantVisual.css'

const STAGE_NAMES = ['种子', '发芽', '幼苗', '小树', '大树', '结果']

export default function PlantVisual({ stage = 0, health = 'growing', size = 120, onClick }) {
  const healthClass = `plant-${health}`
  const stageClass = `plant-stage-${stage}`
  
  const renderPlant = () => {
    switch (stage) {
      case 0: // 种子 - 土堆+半埋种子，占画面下半部分
        return (
          <g className="plant-stage-content">
            {/* 土堆 */}
            <ellipse cx="60" cy="95" rx="35" ry="10" fill="#8B6914" />
            <ellipse cx="60" cy="93" rx="28" ry="6" fill="#A67C3D" />
            {/* 种子 - 半埋在土里 */}
            <ellipse cx="60" cy="90" rx="10" ry="6" fill="#5D4037" />
            <ellipse cx="58" cy="88" rx="4" ry="2" fill="#795548" opacity="0.6" />
          </g>
        )
      
      case 1: // 发芽 - 土堆+嫩茎30px+顶部心形小叶
        return (
          <g className="plant-stage-content">
            {/* 土堆 */}
            <ellipse cx="60" cy="98" rx="32" ry="9" fill="#8B6914" />
            <ellipse cx="60" cy="96" rx="26" ry="5" fill="#A67C3D" />
            {/* 嫩茎 - 贝塞尔曲线，高约30px */}
            <path d="M60 95 Q58 80 60 65" stroke="#5D8A3C" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* 顶部心形叶片 */}
            <path d="M60 65 Q54 58 60 53 Q66 58 60 65" fill="#81C784" />
          </g>
        )
      
      case 2: // 幼苗 - 土堆+茎45px+左右椭圆叶（有叶脉）
        return (
          <g className="plant-stage-content">
            {/* 土堆 */}
            <ellipse cx="60" cy="100" rx="32" ry="9" fill="#8B6914" />
            <ellipse cx="60" cy="98" rx="26" ry="5" fill="#A67C3D" />
            {/* 茎 - 高约45px，贝塞尔曲线 */}
            <path d="M60 97 Q56 75 60 55" stroke="#5D8A3C" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* 左叶片 - 较小 */}
            <ellipse cx="46" cy="72" rx="10" ry="6" fill="#4CAF50" transform="rotate(-35 46 72)" />
            <path d="M46 72 Q42 72 38 72" stroke="#81C784" strokeWidth="1" opacity="0.5" />
            {/* 右叶片 - 较大 */}
            <ellipse cx="74" cy="65" rx="12" ry="7" fill="#4CAF50" transform="rotate(30 74 65)" />
            <path d="M74 65 Q79 63 84 65" stroke="#81C784" strokeWidth="1" opacity="0.5" />
          </g>
        )
      
      case 3: // 小树 - 主干55px+3-4片错落叶子
        return (
          <g className="plant-stage-content">
            {/* 土堆 */}
            <ellipse cx="60" cy="105" rx="35" ry="10" fill="#8B6914" />
            <ellipse cx="60" cy="103" rx="28" ry="6" fill="#A67C3D" />
            {/* 主干 - 高约55px，棕绿色 */}
            <path d="M55 103 L55 50 Q55 45 60 45 Q65 45 65 50 L65 103" fill="#6D8B3A" />
            {/* 树冠 - 3-4片叶子错落 */}
            <ellipse cx="60" cy="35" rx="22" ry="18" fill="#4CAF50" />
            <ellipse cx="45" cy="42" rx="12" ry="10" fill="#5D9A4A" />
            <ellipse cx="75" cy="40" rx="14" ry="11" fill="#5D9A4A" />
            <ellipse cx="60" cy="22" rx="14" ry="11" fill="#81C784" />
          </g>
        )
      
      case 4: // 大树 - 粗主干+3-4个不同深浅绿色圆叠加
        return (
          <g className="plant-stage-content">
            {/* 土堆 */}
            <ellipse cx="60" cy="108" rx="38" ry="10" fill="#8B6914" />
            <ellipse cx="60" cy="106" rx="30" ry="6" fill="#A67C3D" />
            {/* 粗壮主干 - 纯棕色 */}
            <path d="M48 106 L48 50 Q48 40 60 40 Q72 40 72 50 L72 106" fill="#795548" />
            {/* 饱满树冠 - 4个不同深浅绿色圆叠加 */}
            <circle cx="60" cy="28" r="28" fill="#4CAF50" />
            <circle cx="42" cy="38" r="18" fill="#5D9A4A" />
            <circle cx="78" cy="36" r="16" fill="#5D9A4A" />
            <circle cx="60" cy="14" r="20" fill="#81C784" />
          </g>
        )
      
      case 5: // 结果 - stage4基础上+2-3个橙红色小圆果实
        return (
          <g className="plant-stage-content">
            {/* 土堆 */}
            <ellipse cx="60" cy="108" rx="38" ry="10" fill="#8B6914" />
            <ellipse cx="60" cy="106" rx="30" ry="6" fill="#A67C3D" />
            {/* 粗壮主干 */}
            <path d="M48 106 L48 50 Q48 40 60 40 Q72 40 72 50 L72 106" fill="#795548" />
            {/* 饱满树冠 */}
            <circle cx="60" cy="28" r="28" fill="#4CAF50" />
            <circle cx="42" cy="38" r="18" fill="#5D9A4A" />
            <circle cx="78" cy="36" r="16" fill="#5D9A4A" />
            <circle cx="60" cy="14" r="20" fill="#81C784" />
            {/* 果实 - 橙红色，直径8px，位置错落 */}
            <circle cx="38" cy="45" r="8" fill="#FF7043" />
            <circle cx="82" cy="32" r="8" fill="#FF7043" />
            <circle cx="58" cy="8" r="8" fill="#FF7043" />
          </g>
        )
      
      default:
        return null
    }
  }
  
  const getAnimationClass = () => {
    if (health === 'dead') return 'plant-dead-anim'
    if (health === 'wilting') return 'plant-wilting-anim'
    if (health === 'thriving') return 'plant-thriving-anim'
    return 'plant-floating-anim'
  }
  
  return (
    <div 
      className={`plant-visual ${healthClass} ${stageClass} ${getAnimationClass()}`} 
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg viewBox="0 -12 120 132" width={size} height={size}>
        {renderPlant()}
      </svg>
    </div>
  )
}

export { STAGE_NAMES }
