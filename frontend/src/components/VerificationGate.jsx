import { useMemo } from 'react'
import { useVerificationSlider } from '../hooks/useVerificationSlider'

export default function VerificationGate({ onVerified }) {
  const { trackRef, pos, dragging, stage, checks, begin } = useVerificationSlider({ onVerified })
  const pct = Math.round(pos * 100)

  const labelText = useMemo(() => {
    if (stage === 'locked' || stage === 'leaving') return '✓ VERIFIED'
    if (stage === 'snapping') return 'LOCKING…'
    if (pos > 0.85) return 'RELEASE TO ENTER'
    if (pos > 0.5) return 'ALMOST THERE'
    if (dragging) return `${pct}%`
    return 'SLIDE TO ENTER'
  }, [pos, dragging, stage, pct])

  return (
    <div className={`gate ${stage === 'leaving' ? 'is-leaving' : ''}`} data-stage={stage}>
      <div className="gate-bg" />
      <div className="gate-card">

        <div className="gate-strip">
          <span className="gs-brand">SchoolBlock</span>
          <span className="gs-mid">A continuously updated blocklist for school networks</span>
          <span className="gs-right">13 May 2026</span>
        </div>

        <div className="gate-main">
          <div className="gate-eyebrow">
            <span className="ge-dot">●</span>
            <span>Verification required</span>
            <span className="ge-rule" />
            <span className="ge-sec">No account · No tracking · One drag</span>
          </div>

          <h1 className="gate-h">
            Confirm you're <span className="gate-em">human.</span>
          </h1>
          <p className="gate-sub">
            This list is maintained for school IT teams and network administrators.
            Drag the handle across to verify and we'll let you in.
          </p>

          <div
            ref={trackRef}
            className={`vslider ${stage} ${dragging ? 'is-drag' : ''}`}
            data-pct={pct}
          >
            {[33, 66, 92].map((m, i) => (
              <div
                key={m}
                className={`vs-mile ${pct > m ? 'is-passed' : ''}`}
                style={{ left: `calc(${m}% - 1px)` }}
              >
                <span className="vs-mile-tick">{['I', 'II', 'III'][i]}</span>
              </div>
            ))}

            <div className="vs-fill" style={{ width: `calc(102px + ${pos} * (100% - 108px))` }} />

            <div className="vs-arrows">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="vs-arr" style={{ animationDelay: `${i * 0.06}s` }}>›</span>
              ))}
            </div>

            <div className="vs-label">{labelText}</div>

            <div
              className="vs-handle"
              style={{ left: `calc(6px + ${pos} * (100% - 108px))` }}
              onMouseDown={begin}
              onTouchStart={begin}
            >
              <div className="vs-grips"><span /><span /><span /></div>
              <div className="vs-handle-icon">
                {stage === 'locked' || stage === 'leaving' ? '✓' : '›'}
              </div>
              <div className="vs-grips vs-grips--r"><span /><span /><span /></div>
            </div>
          </div>

          <div className="gate-checks">
            <div className={`check ${checks.kinematics ? 'is-on' : ''}`}>
              <span className="ck-mark">{checks.kinematics ? '✓' : '○'}</span>
              <span className="ck-text">Human movement pattern</span>
              <span className="ck-meta">{checks.kinematics ? 'OK' : '—'}</span>
            </div>
            <div className={`check ${checks.range ? 'is-on' : ''}`}>
              <span className="ck-mark">{checks.range ? '✓' : '○'}</span>
              <span className="ck-text">Drag range confirmed</span>
              <span className="ck-meta">{checks.range ? 'OK' : '—'}</span>
            </div>
            <div className={`check ${checks.commit ? 'is-on' : ''}`}>
              <span className="ck-mark">{checks.commit ? '✓' : '○'}</span>
              <span className="ck-text">Commit gesture complete</span>
              <span className="ck-meta">{checks.commit ? 'OK' : '—'}</span>
            </div>
          </div>

          <div className="gate-foot">
            <div className="gf-l">
              <span className="gf-k">Why verify?</span>
              <span className="gf-v">Keeps the list out of automated scrapers and student bypass scripts.</span>
            </div>
            <div className="gf-r">
              <span className="gf-k">Maintained by</span>
              <span className="gf-v">A specialist team · est. March 2024</span>
            </div>
          </div>
        </div>

        <div className="gate-bottom">
          <span>SCHOOLBLOCK</span>
          <span className="gb-dot">●</span>
          <span>ISSUE 142 · VOL 4 · NO 19</span>
          <span className="gb-dot">●</span>
          <span>CONTINUOUSLY UPDATED</span>
        </div>

      </div>
    </div>
  )
}
