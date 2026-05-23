// src/components/TourOverlay.jsx
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── ECO mini SVG ─────────────────────────────────────────────────────────────
function EcoAvatar({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 170 210" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <ellipse cx="85" cy="155" rx="22" ry="22" fill="#7dcc6e"/>
      <ellipse cx="85" cy="163" rx="13" ry="11" fill="#c8e8c2"/>
      <ellipse cx="28" cy="108" rx="11" ry="28" fill="#3a7a32" transform="rotate(-14 28 108)"/>
      <ellipse cx="142" cy="108" rx="11" ry="28" fill="#3a7a32" transform="rotate(14 142 108)"/>
      <circle cx="85" cy="88" r="62" fill="#3a7a32"/>
      <circle cx="60" cy="80" r="22" fill="#fff" stroke="#c8a84e" strokeWidth="2"/>
      <circle cx="110" cy="80" r="22" fill="#fff" stroke="#c8a84e" strokeWidth="2"/>
      <circle cx="62" cy="82" r="13" fill="#1a3a14"/>
      <circle cx="112" cy="82" r="13" fill="#1a3a14"/>
      <circle cx="55" cy="74" r="6" fill="#fff"/>
      <circle cx="105" cy="74" r="6" fill="#fff"/>
      <path d="M62,110 Q85,128 108,110" stroke="#1a3a14" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null)
  const afRef     = useRef(null)

  useEffect(() => {
    if (!active) return
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    cvs.width  = window.innerWidth
    cvs.height = window.innerHeight

    const COLORS = ['#c8a84e','#3a7a32','#7dcc6e','#f4c0d1','#fff','#e8c84e']
    const particles = Array.from({ length: 110 }, () => ({
      x:     Math.random() * cvs.width,
      y:     -20 - Math.random() * 80,
      r:     4 + Math.random() * 6,
      dx:    (Math.random() - 0.5) * 3,
      dy:    2 + Math.random() * 3.5,
      rot:   Math.random() * 360,
      drot:  (Math.random() - 0.5) * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      w:     5 + Math.random() * 7,
      h:     3 + Math.random() * 5,
      alpha: 1,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      let alive = false
      particles.forEach(p => {
        if (p.y < cvs.height + 20) {
          alive = true
          p.x += p.dx; p.y += p.dy; p.rot += p.drot; p.dy += 0.055
          if (p.y > cvs.height * 0.72) p.alpha = Math.max(0, p.alpha - 0.018)
          ctx.save()
          ctx.globalAlpha = p.alpha
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot * Math.PI / 180)
          ctx.fillStyle = p.color
          if (p.shape === 'rect') ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill() }
          ctx.restore()
        }
      })
      if (alive) afRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { if (afRef.current) cancelAnimationFrame(afRef.current) }
  }, [active])

  if (!active) return null
  return (
    <canvas
      ref={canvasRef}
      style={{ position:'fixed', inset:0, zIndex:39999, pointerEvents:'none' }}
    />
  )
}

// ─── Spotlight helper ─────────────────────────────────────────────────────────
// Instead of manipulating DOM classes, we render a full-screen overlay with a
// "hole" cut out using SVG clipPath over the target element's bounding rect.
function SpotlightOverlay({ targetSelector, active, onClick }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!active || !targetSelector) { setRect(null); return }

    const measure = () => {
      const el = document.querySelector(targetSelector)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12, br: 14 })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [targetSelector, active])

  if (!active) return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9900, cursor:'default' }}
      onClick={onClick}
    >
      <svg width={vw} height={vh} style={{ position:'absolute', inset:0 }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width={vw} height={vh} fill="white"/>
            {rect && (
              <rect
                x={rect.left} y={rect.top}
                width={rect.width} height={rect.height}
                rx={rect.br} ry={rect.br}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width={vw} height={vh}
          fill="rgba(8,20,6,0.68)"
          mask="url(#tour-spotlight-mask)"
        />
        {rect && (
          <rect
            x={rect.left} y={rect.top}
            width={rect.width} height={rect.height}
            rx={rect.br} ry={rect.br}
            fill="none"
            stroke="#c8a84e"
            strokeWidth="2.5"
          />
        )}
      </svg>
    </div>
  )
}

// ─── Tooltip positioner ───────────────────────────────────────────────────────
function useTooltipPos(targetSelector, position, tooltipW, tooltipH) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth, vh = window.innerHeight
      const gap = 18
      let top, left

      if (!targetSelector || position === 'center') {
        left = (vw - tooltipW) / 2
        top  = (vh - tooltipH) / 2
      } else {
        const el = document.querySelector(targetSelector)
        if (!el) { left = 40; top = 40 }
        else {
          const r = el.getBoundingClientRect()
          if (position === 'right') {
            left = r.right + gap
            top  = r.top + (r.height - tooltipH) / 2
          } else if (position === 'left') {
            left = r.left - tooltipW - gap
            top  = r.top + (r.height - tooltipH) / 2
          } else if (position === 'bottom') {
            left = r.left + (r.width - tooltipW) / 2
            top  = r.bottom + gap
          } else { // top
            left = r.left + (r.width - tooltipW) / 2
            top  = r.top - tooltipH - gap
          }
        }
      }

      setPos({
        left: Math.max(12, Math.min(vw - tooltipW - 12, left)),
        top:  Math.max(12, Math.min(vh - tooltipH - 12, top)),
      })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [targetSelector, position, tooltipW, tooltipH])

  return pos
}

// ─── Main TourOverlay ─────────────────────────────────────────────────────────
export default function TourOverlay({
  tourActive,
  showDone,
  step,
  steps,
  tourIndex,
  tourWaiting,
  role,
  next,
  back,
  skip,
  closeDone,
  resetTour,
}) {
  const TW = 320, TH = 220  // tooltip dimensions (approximate)
  const pos = useTooltipPos(
    tourActive && step ? step.target : null,
    tourActive && step ? step.position : 'center',
    TW, TH
  )

  // Count non-final steps for dots
  const dotSteps = steps.filter(s => !s.isFinal)
  const isFirst  = tourIndex === 0

  if (!tourActive && !showDone) return null

  return (
    <>
      {/* Spotlight overlay */}
      {tourActive && step && (
        <SpotlightOverlay
          targetSelector={step.target}
          active={!!step.target}
          onClick={undefined}
        />
      )}

      {/* Dark bg for center steps */}
      {tourActive && step && !step.target && (
        <div style={{
          position:'fixed', inset:0, zIndex:9900,
          background:'rgba(8,20,6,0.72)',
          backdropFilter:'blur(4px)',
        }} />
      )}

      {/* Progress bar */}
      {tourActive && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, height:3,
          zIndex:9999, background:'rgba(200,168,78,0.4)',
        }}>
          <div style={{
            height:'100%',
            width: `${Math.round((tourIndex / Math.max(dotSteps.length - 1, 1)) * 100)}%`,
            background:'linear-gradient(90deg, #1A4D35, #c8a84e)',
            transition:'width 0.4s ease',
          }} />
        </div>
      )}

      {/* Step counter chip */}
      {tourActive && (
        <div style={{
          position:'fixed', top:14, right:14, zIndex:9999,
          background:'#c8a84e', color:'#fff',
          fontSize:11, fontWeight:700,
          padding:'4px 10px', borderRadius:20,
        }}>
          Step {tourIndex + 1} of {dotSteps.length}
        </div>
      )}

      {/* Tooltip */}
      {tourActive && step && !step.isFinal && (
        <div
          key={tourIndex}
          style={{
            position:'fixed',
            left: pos.left,
            top:  pos.top,
            width: TW,
            zIndex:9950,
            background:'#fff',
            borderRadius:20,
            border:'2px solid #e8ead8',
            boxShadow:'0 16px 52px rgba(10,22,8,0.5)',
            overflow:'hidden',
            animation:'ttIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <style>{`
            @keyframes ttIn {
              from { opacity:0; transform:scale(0.88) translateY(10px); }
              to   { opacity:1; transform:scale(1)    translateY(0);    }
            }
            @keyframes pulseHint {
              0%,100% { box-shadow:0 0 0 0 rgba(200,168,78,0.65); }
              50%     { box-shadow:0 0 0 7px rgba(200,168,78,0);   }
            }
          `}</style>

          {/* Header */}
          <div style={{ background:'#1A4D35', padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <EcoAvatar size={38} />
            <div style={{ flex:1 }}>
              <strong style={{ display:'block', fontSize:13.5, color:'#f0ffe8' }}>{step.title}</strong>
              <span style={{ fontSize:10, color:'rgba(168,216,152,0.85)' }}>Step {tourIndex + 1} of {dotSteps.length}</span>
            </div>
            <button
              onClick={skip}
              style={{
                background:'none', border:'none', cursor:'pointer',
                color:'rgba(255,255,255,0.45)', fontSize:11,
                fontFamily:'inherit', padding:'4px 6px', borderRadius:6,
              }}
            >
              Skip tour
            </button>
          </div>

          {/* Body */}
          <div style={{ padding:'15px 18px 10px' }}>
            <p style={{ fontSize:13, color:'#3a5234', lineHeight:1.6, margin:0 }}>{step.msg}</p>

            {/* Action hint */}
            {tourWaiting && (
              <div style={{
                marginTop:11, padding:'9px 13px',
                background:'#fff8e4', border:'1px solid #e8d58a',
                borderRadius:9, fontSize:12, color:'#7a6010',
                display:'flex', alignItems:'center', gap:7,
                animation:'pulseHint 1.8s ease-in-out infinite',
              }}>
                <span>👆</span>
                <span>{step.actionHint || 'Click to continue!'}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'10px 16px', borderTop:'1px solid #e8ead8',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            {/* Dots */}
            <div style={{ display:'flex', gap:5 }}>
              {dotSteps.map((_, i) => (
                <div key={i} style={{
                  height:7, borderRadius:4,
                  width:    i === tourIndex ? 18 : (i < tourIndex ? 12 : 7),
                  background: i === tourIndex ? '#1A4D35' : (i < tourIndex ? '#c8a84e' : '#d8ead8'),
                  transition:'all 0.25s',
                }} />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display:'flex', gap:7 }}>
              <button
                onClick={back}
                disabled={isFirst}
                style={{
                  padding:'7px 14px', borderRadius:8, fontSize:12,
                  fontWeight:600, cursor: isFirst ? 'default' : 'pointer',
                  border:'none', fontFamily:'inherit',
                  background:'#ebebeb', color: isFirst ? '#bbb' : '#555',
                  opacity: isFirst ? 0.45 : 1,
                }}
              >← Back</button>
              <button
                onClick={next}
                disabled={tourWaiting}
                style={{
                  padding:'7px 16px', borderRadius:8, fontSize:12,
                  fontWeight:600, cursor: tourWaiting ? 'not-allowed' : 'pointer',
                  border:'none', fontFamily:'inherit',
                  background: tourWaiting ? '#c8d8c0' : '#1A4D35',
                  color:'#fff',
                  transition:'background 0.15s',
                }}
              >Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done / celebration card ── */}
      {showDone && (
        <>
          <Confetti active={showDone} />
          <div style={{
            position:'fixed', inset:0, zIndex:40000,
            background:'rgba(8,20,6,0.72)',
            display:'flex', alignItems:'center', justifyContent:'center',
            backdropFilter:'blur(6px)',
          }}>
            <div style={{
              background:'#fff', borderRadius:24,
              padding:'40px 36px', textAlign:'center',
              maxWidth:420, width:'90%',
              boxShadow:'0 32px 80px rgba(10,22,8,0.6)',
              animation:'ttIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              <div style={{ fontSize:52, marginBottom:12, display:'block',
                animation:'bounceIn 0.8s ease 0.2s both' }}>🎉</div>
              <style>{`
                @keyframes bounceIn {
                  0%   { transform:scale(0) rotate(-30deg); }
                  60%  { transform:scale(1.2) rotate(6deg); }
                  80%  { transform:scale(0.95) rotate(-3deg); }
                  100% { transform:scale(1) rotate(0); }
                }
              `}</style>
              <h2 style={{ fontFamily:"'DM Serif Display', serif", fontSize:26, color:'#1A4D35', marginBottom:8 }}>
                {role === 'junkshop' ? "Your junkshop just got smarter! 🏭" : "You're all set, eco-hero! 🌿"}
              </h2>
              <p style={{ fontSize:13.5, color:'#6a8a64', lineHeight:1.65, marginBottom:24 }}>
                {role === 'junkshop'
                  ? "You're ready to source recyclables through WAIZ! Head to Pickup Requests to see what's available in your area today."
                  : "That's the full tour! Post your first item — old newspapers, bottles, scrap metal — anything recyclable has value here. ♻️"
                }
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button
                  onClick={closeDone}
                  style={{
                    padding:'10px 22px', borderRadius:12, fontSize:13,
                    fontWeight:600, cursor:'pointer',
                    border:'1.5px solid #d8ead8', background:'transparent', color:'#555',
                    fontFamily:'inherit',
                  }}
                >Explore Later</button>
                <button
                  onClick={closeDone}
                  style={{
                    padding:'10px 22px', borderRadius:12, fontSize:13,
                    fontWeight:600, cursor:'pointer',
                    border:'none', background:'#C97A3A', color:'#fff',
                    fontFamily:'inherit',
                  }}
                >
                  {role === 'junkshop' ? 'Browse Listings →' : 'Post My First Item →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Dev reset button ── */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={resetTour}
          style={{
            position:'fixed', bottom:14, left:14, zIndex:9998,
            background:'rgba(45,90,39,0.35)', border:'1px solid #6a8a64',
            color:'#2d5a27', fontSize:11, padding:'6px 12px',
            borderRadius:20, cursor:'pointer', fontFamily:'inherit',
          }}
        >
          ↺ Reset Tour (dev)
        </button>
      )}
    </>
  )
}