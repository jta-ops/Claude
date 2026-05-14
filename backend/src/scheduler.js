const { runDetectionCycle } = require('./detection')

const INTERVAL_MS = 2 * 60 * 60 * 1000  // 2 hours

function start() {
  setTimeout(async () => {
    console.log('[scheduler] Running initial detection cycle')
    await runDetectionCycle().catch(err => console.error('[scheduler] Error:', err.message))
  }, 30_000)

  setInterval(async () => {
    console.log('[scheduler] Running scheduled detection cycle')
    await runDetectionCycle().catch(err => console.error('[scheduler] Error:', err.message))
  }, INTERVAL_MS)

  console.log(`[scheduler] Auto-detection active — runs every 2h`)
}

module.exports = { start }
