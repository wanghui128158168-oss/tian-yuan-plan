let audioCtx = null

const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

export const playHammerSound = () => {
  try {
    const ctx = getCtx()
    const osc1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    osc1.connect(g1)
    g1.connect(ctx.destination)
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(120, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12)
    g1.gain.setValueAtTime(0.4, ctx.currentTime)
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.15)
    const bufferSize = ctx.sampleRate * 0.1
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const nGain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, ctx.currentTime)
    noise.connect(filter)
    filter.connect(nGain)
    nGain.connect(ctx.destination)
    nGain.gain.setValueAtTime(0.25, ctx.currentTime)
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

export const playRevealNormal = () => {
  try {
    const ctx = getCtx()
    const notes = [784, 988, 1175]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.35)
    })
  } catch (e) {}
}

export const playRevealRare = () => {
  try {
    const ctx = getCtx()
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.07
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
      osc.start(t)
      osc.stop(t + 0.6)
    })
    setTimeout(() => {
      try {
        const shimmer = ctx.createOscillator()
        const sGain = ctx.createGain()
        shimmer.connect(sGain)
        sGain.connect(ctx.destination)
        shimmer.type = 'sine'
        shimmer.frequency.setValueAtTime(2637, ctx.currentTime)
        shimmer.frequency.exponentialRampToValueAtTime(3951, ctx.currentTime + 0.5)
        sGain.gain.setValueAtTime(0.06, ctx.currentTime)
        sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
        shimmer.start(ctx.currentTime)
        shimmer.stop(ctx.currentTime + 0.8)
      } catch(e) {}
    }, 300)
  } catch (e) {}
}
