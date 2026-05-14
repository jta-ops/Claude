import { useState, useRef, useEffect, useCallback } from 'react'

export function useVerificationSlider({ onVerified }) {
  const trackRef = useRef(null)
  const [pos, setPos] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [stage, setStage] = useState('idle')
  const [checks, setChecks] = useState({ kinematics: false, range: false, commit: false })
  const state = useRef({ startT: 0, lastT: 0, lastX: 0, samples: [], corrections: 0, max: 0, lastDir: 0, pointerOffset: 0 })
  const posRef = useRef(pos)
  useEffect(() => { posRef.current = pos }, [pos])

  const animTo = useCallback((target, dur = 320) => {
    const from = posRef.current
    const start = performance.now()
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      const v = from + (target - from) * eased
      setPos(v)
      if (k < 1) { requestAnimationFrame(step) } else {
        setPos(target)
        if (target === 1) {
          setStage('locked')
          setTimeout(() => { setStage('leaving'); setTimeout(() => onVerified?.(), 750) }, 650)
        }
      }
    }
    requestAnimationFrame(step)
  }, [onVerified])

  const update = useCallback((clientX) => {
    if (!trackRef.current) return
    const r = trackRef.current.getBoundingClientRect()
    const handleW = 96, inset = 6
    const usable = r.width - handleW - inset * 2
    const raw = (clientX - r.left - inset - state.current.pointerOffset) / usable
    const clamped = Math.max(0, Math.min(1, raw))
    const s = state.current
    const now = performance.now()
    const dt = now - s.lastT
    const dx = clamped - s.lastX
    if (dt > 0 && Math.abs(dx) > 0.001) {
      const speed = Math.abs(dx) / dt
      s.samples.push(speed)
      const dir = Math.sign(dx)
      if (dir !== 0 && s.lastDir !== 0 && dir !== s.lastDir) s.corrections += 1
      s.lastDir = dir
    }
    s.lastT = now; s.lastX = clamped; s.max = Math.max(s.max, clamped)
    setPos(clamped)
    setChecks({ kinematics: s.samples.length > 6 && s.samples.some(x => x > 0), range: clamped > 0.33, commit: clamped > 0.92 })
  }, [])

  const begin = useCallback((e) => {
    if (['locked','leaving','snapping'].includes(stage)) return
    e.preventDefault(); e.stopPropagation()
    const r = trackRef.current.getBoundingClientRect()
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const handleW = 96, inset = 6
    const handleLeft = r.left + inset + posRef.current * (r.width - handleW - inset * 2)
    state.current = { startT: performance.now(), lastT: performance.now(), lastX: posRef.current, samples: [], corrections: 0, max: posRef.current, lastDir: 0, pointerOffset: x - handleLeft }
    setDragging(true); setStage('dragging')
  }, [stage])

  const end = useCallback(() => {
    setDragging(d => {
      if (!d) return d
      if (posRef.current > 0.85) { setStage('snapping'); animTo(1, 240) }
      else { setStage('idle'); animTo(0, 420) }
      return false
    })
  }, [animTo])

  useEffect(() => {
    if (!dragging) return
    const mm = (e) => { const x = e.touches ? e.touches[0].clientX : e.clientX; if (e.touches) e.preventDefault(); update(x) }
    const mu = () => end()
    window.addEventListener('mousemove', mm)
    window.addEventListener('touchmove', mm, { passive: false })
    window.addEventListener('mouseup', mu)
    window.addEventListener('touchend', mu)
    window.addEventListener('touchcancel', mu)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('touchmove', mm)
      window.removeEventListener('mouseup', mu)
      window.removeEventListener('touchend', mu)
      window.removeEventListener('touchcancel', mu)
    }
  }, [dragging, end, update])

  return { trackRef, pos, dragging, stage, checks, begin }
}
