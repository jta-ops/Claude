import { useState } from 'react'

const CATEGORIES = [
  { value: 'GAMES',    label: 'Games / unblocked portals' },
  { value: 'PROXY',    label: 'Proxies / VPN bypass' },
  { value: 'DISGUISE', label: 'Disguised sites' },
  { value: 'CHEATING', label: 'Cheating / answer sites' },
  { value: 'SOCIAL',   label: 'Social media' },
  { value: 'AI',       label: 'AI / chatbot bypass' },
  { value: 'OTHER',    label: 'Other' },
]

export default function SubmitSection() {
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('GAMES')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), category, email: email.trim() || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setState('error')
          setErrorMsg(data.error || 'This domain is already on the list or pending review.')
        } else {
          setState('error')
          setErrorMsg(data.error || 'Submission failed. Please try again.')
        }
        return
      }

      setState('success')
    } catch {
      setState('error')
      setErrorMsg('Could not reach the server. Please try again later.')
    }
  }

  function reset() {
    setUrl('')
    setEmail('')
    setCategory('GAMES')
    setState('idle')
    setErrorMsg('')
  }

  return (
    <section className="submit" id="submit">
      <div className="section-head">
        <div className="sh-left">
          <span className="sh-num">06</span>
          <h2 className="sh-h">Submit <span className="sh-em">a site.</span></h2>
        </div>
        <div className="sh-right">
          <span className="sh-meta">Reviewed within 24 hours</span>
        </div>
      </div>

      <div className="submit-grid">
        <div className="submit-info">
          <h3 className="si-h">Found something we're missing?</h3>
          <p className="si-body">
            Every submission goes through a server-side review. We fetch the URL,
            check it against our keyword list, and score it before a human looks at
            it. If approved, it's on the next list update.
          </p>
          <div className="si-steps">
            <div className="si-step">
              <span className="sis-n">01</span>
              <span className="sis-t">You submit the URL</span>
            </div>
            <div className="si-step">
              <span className="sis-n">02</span>
              <span className="sis-t">We fetch and analyse it server-side</span>
            </div>
            <div className="si-step">
              <span className="sis-n">03</span>
              <span className="sis-t">A reviewer approves or rejects it</span>
            </div>
            <div className="si-step">
              <span className="sis-n">04</span>
              <span className="sis-t">Goes live in the next update</span>
            </div>
          </div>
        </div>

        <div className="submit-form-wrap">
          {state === 'success' ? (
            <div className="submit-success">
              <div className="ss-mark">✓</div>
              <div className="ss-h">Submission received</div>
              <p className="ss-body">
                We'll fetch and review the URL. If approved, it will appear in the next list update.
                You'll be notified if you left an email address.
              </p>
              <button className="ss-again" onClick={reset}>Submit another →</button>
            </div>
          ) : (
            <form className="submit-form" onSubmit={handleSubmit} noValidate>
              <div className="sf-field">
                <label className="sf-label" htmlFor="submit-url">URL or domain</label>
                <div className="sf-input-wrap">
                  <span className="sf-prefix">https://</span>
                  <input
                    id="submit-url"
                    className="sf-input"
                    type="text"
                    placeholder="example.com or full URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    disabled={state === 'loading'}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="sf-field">
                <label className="sf-label" htmlFor="submit-cat">Category</label>
                <div className="sf-select-wrap">
                  <select
                    id="submit-cat"
                    className="sf-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={state === 'loading'}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <span className="sf-arrow">▾</span>
                </div>
              </div>

              <div className="sf-field">
                <label className="sf-label" htmlFor="submit-email">
                  Your email <span className="sf-optional">(optional — for update notifications)</span>
                </label>
                <input
                  id="submit-email"
                  className="sf-input sf-input--full"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === 'loading'}
                />
              </div>

              {errorMsg && (
                <div className="sf-error">{errorMsg}</div>
              )}

              <button
                className={`sf-submit ${state === 'loading' ? 'is-loading' : ''}`}
                type="submit"
                disabled={state === 'loading' || !url.trim()}
              >
                {state === 'loading' ? (
                  <><span className="sf-spinner" />Submitting…</>
                ) : (
                  'Submit for review →'
                )}
              </button>

              <p className="sf-note">
                Submissions are reviewed by a human. False positives and legitimate
                educational content will not be added.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
