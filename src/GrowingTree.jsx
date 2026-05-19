import { useEffect, useRef } from 'react'
import './GrowingTree.css'

// 兼容老 Safari/Chrome，避免 ctx.roundRect 在 iOS 16.4 以下不支持导致白屏
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  ctx.lineTo(x + rr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
  ctx.lineTo(x, y + rr)
  ctx.quadraticCurveTo(x, y, x + rr, y)
  ctx.closePath()
}

function drawScene(ctx, p, abandoned) {
  const W = 220, H = 220, GY = 170, CX = 110
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  roundRectPath(ctx, 0, 0, W, H, 20); ctx.clip()

  const skyT = p<.3?'#C8EDD8':p<.7?'#A8D9EE':'#87CEEB'
  const skyB = p<.3?'#B8DEB8':p<.7?'#C0EAD0':'#C2E8C2'
  const gSky = ctx.createLinearGradient(0,0,0,GY)
  gSky.addColorStop(0,skyT); gSky.addColorStop(1,skyB)
  ctx.fillStyle=gSky; ctx.fillRect(0,0,W,H)

  if(p>.05){
    const so=Math.min(1,(p-.05)/.3), sr=10+p*12
    const gSun=ctx.createRadialGradient(185,30,0,185,30,sr*2.2)
    gSun.addColorStop(0,'rgba(255,245,160,.85)'); gSun.addColorStop(1,'rgba(255,245,160,0)')
    ctx.fillStyle=gSun; ctx.globalAlpha=so
    ctx.beginPath(); ctx.arc(185,30,sr*2.2,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='#FFE082'; ctx.globalAlpha=so
    ctx.beginPath(); ctx.arc(185,30,sr*.7,0,Math.PI*2); ctx.fill()
    ctx.globalAlpha=1
  }

  if(p>.15){
    const ho=Math.min(.75,(p-.15)/.35); ctx.globalAlpha=ho
    ctx.fillStyle='#B2DFAB'; ctx.beginPath(); ctx.ellipse(45,GY-4,72,22,0,Math.PI,0); ctx.fill()
    ctx.fillStyle='#94CFA0'; ctx.beginPath(); ctx.ellipse(178,GY-2,58,16,0,Math.PI,0); ctx.fill()
    ctx.globalAlpha=1
  }

  if(p>.32){
    const co=Math.min(.8,(p-.32)/.3); ctx.globalAlpha=co
    const cloud=(x,y,s)=>{
      ctx.fillStyle='rgba(255,255,255,.88)'
      ctx.beginPath(); ctx.arc(x,y,12*s,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(x+14*s,y+2*s,9*s,0,Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(x-10*s,y+3*s,8*s,0,Math.PI*2); ctx.fill()
    }
    cloud(38,52,.9); if(p>.55) cloud(160,44,.75); ctx.globalAlpha=1
  }

  const gGnd=ctx.createLinearGradient(0,GY,0,H)
  gGnd.addColorStop(0,'#5D9B3A'); gGnd.addColorStop(.25,'#8B6914'); gGnd.addColorStop(1,'#5C3A1E')
  ctx.fillStyle=gGnd; ctx.fillRect(0,GY,W,H-GY)

  const blades=[8,22,36,52,68,84,152,168,183,198,212]
  ctx.strokeStyle='#43A047'; ctx.lineWidth=1.8; ctx.lineCap='round'
  blades.forEach(x=>{
    ctx.globalAlpha=p>.1?.8:.25
    ctx.beginPath(); ctx.moveTo(x,GY); ctx.quadraticCurveTo(x-3,GY-9,x-1,GY-14); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x+5,GY); ctx.quadraticCurveTo(x+8,GY-8,x+6,GY-12); ctx.stroke()
  }); ctx.globalAlpha=1

  const stemH=p<.05?0:p<.2?16*((p-.05)/.15):p<.5?16+36*((p-.2)/.3):p<.85?52+26*((p-.5)/.35):78
  const sTop=GY-stemH, sMid=(GY+sTop)/2

  if(p<.05){
    ctx.fillStyle='#8B6914'; ctx.beginPath(); ctx.ellipse(CX,GY+4,20,6,0,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='#A67C3D'; ctx.beginPath(); ctx.ellipse(CX,GY+2,14,5,0,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='#6D4C1F'; ctx.beginPath(); ctx.ellipse(CX,GY-3,8,5.5,-.2,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='#A1887F'; ctx.globalAlpha=.6
    ctx.beginPath(); ctx.ellipse(CX-2,GY-4.5,3,2,-.2,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1
  }

  if(p>=.05&&p<.2){
    ctx.fillStyle='#8B6914'; ctx.beginPath(); ctx.ellipse(CX,GY+3,16,5.5,0,0,Math.PI*2); ctx.fill()
    ctx.strokeStyle='#5D9B3A'; ctx.lineWidth=3; ctx.lineCap='round'
    ctx.beginPath(); ctx.moveTo(CX,GY); ctx.quadraticCurveTo(CX+3,sMid,CX,sTop); ctx.stroke()
    if(stemH>6){
      const lf=(stemH-6)/10
      ctx.save(); ctx.translate(CX-5,sTop+4); ctx.rotate(-.4)
      ctx.fillStyle='#81C784'; ctx.globalAlpha=Math.min(1,lf)
      ctx.beginPath(); ctx.ellipse(0,0,8,5.5,0,0,Math.PI*2); ctx.fill(); ctx.restore()
      ctx.save(); ctx.translate(CX+7,sTop+1); ctx.rotate(.35)
      ctx.fillStyle='#66BB6A'; ctx.globalAlpha=Math.min(1,lf)
      ctx.beginPath(); ctx.ellipse(0,0,9,5.5,0,0,Math.PI*2); ctx.fill(); ctx.restore()
      ctx.globalAlpha=1
    }
  }

  if(p>=.2&&p<.5){
    ctx.fillStyle='#8B6914'; ctx.beginPath(); ctx.ellipse(CX,GY+2,14,4.5,0,0,Math.PI*2); ctx.fill()
    ctx.strokeStyle='#5D4037'; ctx.lineWidth=5; ctx.lineCap='round'
    ctx.beginPath(); ctx.moveTo(CX,GY); ctx.quadraticCurveTo(CX+4,sMid,CX,sTop); ctx.stroke()
    const lv=[[CX-13,sMid+10,12,7,-.45,'#66BB6A'],[CX+14,sMid+3,13,7.5,.3,'#81C784'],
              [CX-10,sTop+16,10,6.5,-.5,'#4CAF50'],[CX+12,sTop+10,11,6.5,.35,'#66BB6A']]
    lv.forEach(([x,y,rx,ry,r,col])=>{
      ctx.save(); ctx.translate(x,y); ctx.rotate(r)
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.fill(); ctx.restore()
    })
    ctx.fillStyle='#A5D6A7'; ctx.beginPath(); ctx.ellipse(CX,sTop+2,5.5,4,0,0,Math.PI*2); ctx.fill()
  }

  if(p>=.5&&p<.85){
    const tw=7+((p-.5)/.35)*5, crO=(p-.5)/.35
    ctx.fillStyle='rgba(92,58,30,.3)'; ctx.beginPath(); ctx.ellipse(CX+4,GY+3,tw+10,4,0,0,Math.PI*2); ctx.fill()
    const gT=ctx.createLinearGradient(CX-tw,0,CX+tw,0)
    gT.addColorStop(0,'#5D4037'); gT.addColorStop(.5,'#8D6E63'); gT.addColorStop(1,'#5D4037')
    ctx.fillStyle=gT
    roundRectPath(ctx, CX-tw/2, sTop+22, tw, GY-sTop-22, tw/2); ctx.fill()
    ctx.globalAlpha=crO
    ;[[CX,sTop+12,23,'#388E3C'],[CX-17,sTop+25,18,'#4CAF50'],[CX+17,sTop+25,18,'#4CAF50'],
     [CX-9,sTop+5,15,'#66BB6A'],[CX+9,sTop+5,14,'#81C784'],[CX,sTop+30,15,'#43A047']
    ].forEach(([x,y,r,col])=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill() })
    ctx.globalAlpha=1
  }

  if(p>=.85){
    const frO=Math.min(1,(p-.88)/.12)
    ctx.fillStyle='rgba(92,58,30,.25)'; ctx.beginPath(); ctx.ellipse(CX+6,GY+3,32,7,0,0,Math.PI*2); ctx.fill()
    const gT=ctx.createLinearGradient(CX-9,0,CX+9,0)
    gT.addColorStop(0,'#5D4037'); gT.addColorStop(.5,'#8D6E63'); gT.addColorStop(1,'#5D4037')
    ctx.fillStyle=gT
    roundRectPath(ctx, CX-8, sTop+28, 16, GY-sTop-28, 5); ctx.fill()
    ctx.strokeStyle='#5D4037'; ctx.lineWidth=5; ctx.lineCap='round'
    ctx.beginPath(); ctx.moveTo(CX-8,GY-10); ctx.quadraticCurveTo(CX-18,GY-4,CX-24,GY+4); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(CX+8,GY-10); ctx.quadraticCurveTo(CX+18,GY-4,CX+24,GY+4); ctx.stroke()
    ;[[CX,sTop+8,27,'#2E7D32'],[CX-21,sTop+25,21,'#388E3C'],[CX+21,sTop+25,21,'#388E3C'],
     [CX-10,sTop+2,19,'#4CAF50'],[CX+10,sTop+2,18,'#4CAF50'],[CX,sTop+30,17,'#388E3C'],
     [CX-29,sTop+15,16,'#43A047'],[CX+29,sTop+15,16,'#43A047'],
     [CX-7,sTop-3,13,'#66BB6A'],[CX+7,sTop-5,11,'#81C784']
    ].forEach(([x,y,r,col])=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill() })
    if(frO>0){
      ctx.globalAlpha=frO
      ;[[CX-19,sTop+22],[CX+17,sTop+19],[CX-3,sTop+9],[CX+9,sTop+32],[CX-13,sTop+33],[CX+23,sTop+29],[CX-25,sTop+28]
      ].forEach(([fx,fy])=>{
        ctx.fillStyle='#FF7043'; ctx.beginPath(); ctx.arc(fx,fy,5,0,Math.PI*2); ctx.fill()
        ctx.fillStyle='#FFAB91'; ctx.globalAlpha=frO*.6; ctx.beginPath(); ctx.arc(fx-1.5,fy-1.8,2,0,Math.PI*2); ctx.fill()
        ctx.globalAlpha=frO; ctx.strokeStyle='#4E342E'; ctx.lineWidth=1; ctx.lineCap='round'
        ctx.beginPath(); ctx.moveTo(fx,fy-5); ctx.quadraticCurveTo(fx+2,fy-8,fx+1,fy-10); ctx.stroke()
      }); ctx.globalAlpha=1
    }
    if(p>.93){
      const so=Math.min(1,(p-.93)/.07); ctx.globalAlpha=so
      ;[[CX-33,sTop-12],[CX+34,sTop+4],[CX-4,sTop-22],[CX+14,sTop-16]].forEach(([sx,sy])=>{
        ctx.strokeStyle='#FFF176'; ctx.lineWidth=1.8; ctx.lineCap='round'
        ctx.beginPath(); ctx.moveTo(sx,sy-6); ctx.lineTo(sx,sy+6); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(sx-6,sy); ctx.lineTo(sx+6,sy); ctx.stroke()
        ctx.strokeStyle='#FFE082'; ctx.lineWidth=1.2
        ctx.beginPath(); ctx.moveTo(sx-4,sy-4); ctx.lineTo(sx+4,sy+4); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(sx+4,sy-4); ctx.lineTo(sx-4,sy+4); ctx.stroke()
      }); ctx.globalAlpha=1
    }
  }

  if(p>.58){
    const fo=Math.min(1,(p-.58)/.3); ctx.globalAlpha=fo
    ;[[CX-32,GY-4,'#F48FB1'],[CX+30,GY-3,'#CE93D8'],[CX-46,GY-2,'#FFCC80']].forEach(([fx,fy,col])=>{
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(fx,fy,4.5,0,Math.PI*2); ctx.fill()
      ctx.fillStyle='#FFF176'; ctx.beginPath(); ctx.arc(fx,fy,2,0,Math.PI*2); ctx.fill()
    }); ctx.globalAlpha=1
  }

  if(p>.88){
    const bo=Math.min(1,(p-.88)/.1), bx=CX+38, by=GY-stemH*.55
    ctx.globalAlpha=bo*.85; ctx.save(); ctx.translate(bx,by)
    ctx.fillStyle='#CE93D8'; ctx.save(); ctx.rotate(-.35)
    ctx.beginPath(); ctx.ellipse(-5,0,8,5,0,0,Math.PI*2); ctx.fill(); ctx.restore()
    ctx.fillStyle='#F48FB1'; ctx.save(); ctx.rotate(.35)
    ctx.beginPath(); ctx.ellipse(5,0,8,5,0,0,Math.PI*2); ctx.fill(); ctx.restore()
    ctx.strokeStyle='#5D4037'; ctx.lineWidth=1.2
    ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(0,4); ctx.stroke()
    ctx.restore(); ctx.globalAlpha=1
  }

  ctx.restore()
  if(abandoned){
    ctx.save()
    roundRectPath(ctx, 0, 0, W, H, 20); ctx.clip()
    ctx.fillStyle='rgba(30,20,10,.45)'; ctx.fillRect(0,0,W,H); ctx.restore()
  }
}

export default function GrowingTree({ progress=0, abandoned=false }) {
  const canvasRef = useRef(null)
  const p = Math.max(0, Math.min(1, progress))
  useEffect(()=>{
    const cv = canvasRef.current
    if(!cv) return
    // 包 try-catch 兜底：即使绘图出错也不会把整个 App 拖垮
    try {
      const ctx = cv.getContext('2d')
      if (ctx) drawScene(ctx, p, abandoned)
    } catch (err) {
      console.error('[GrowingTree] draw failed:', err)
    }
  }, [p, abandoned])
  return (
    <div className={`growing-tree-container ${abandoned?'abandoned':''} ${p>=1?'complete':''}`}>
      <canvas ref={canvasRef} width={220} height={220} className="growing-tree-canvas" />
      {abandoned && <div className="abandoned-message">这次没撑住，下次再试试 🌱</div>}
    </div>
  )
}
