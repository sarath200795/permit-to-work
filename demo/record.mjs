// Entry point: launch headless Chromium and record the captioned tour to MP4.
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { launch, startScreencast, stopAndEncode, caption, say, showCard, sleep, slowType, moveToSelector, clickButtonByText, dismissCoachmarks, makeSamQuiet } from './recorder.mjs'
import { genericRun } from './generic.mjs'
import { config } from './config.mjs'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const base = 'http://127.0.0.1:' + (process.argv[2] || '5173')
const outDir = path.join(__dir, 'out')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'permit-to-work.mp4')

const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 850 })
await makeSamQuiet(page)
page.setDefaultTimeout(30000)
const rec = await startScreencast(page, path.join('/tmp', 'frames-permit-to-work'))
const ctx = { caption, say: (t) => say(page, t), showCard, sleep, slowType, moveToSelector, clickButtonByText, dismissCoachmarks, base }
try {
  await genericRun(page, ctx, config)
} catch (e) { console.error('TOUR_ERROR:', e.message) }
const res = await stopAndEncode(rec, outFile).catch((e) => { console.error('ENCODE_ERROR:', e.message); return null })
await browser.close()
if (res) console.log('VIDEO_OK', outFile, 'frames=' + res.frames)
