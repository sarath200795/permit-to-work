// Config-driven tutorial tour shared by the apps that follow the common
// "register org → walk the authenticated pages" pattern.

async function typeFirst(page, selectors, value, optional = false) {
  for (const sel of selectors) {
    const el = await page.$(sel)
    if (el) { await el.click(); await page.type(sel, value, { delay: 45 }); return true }
  }
  if (!optional) console.warn('  (no match for', selectors.join(' | '), ')')
  return false
}

export async function genericRun(page, ctx, cfg) {
  const { caption, sleep, clickButtonByText, dismissCoachmarks, base } = ctx
  const stamp = Date.now().toString().slice(-5)
  const org = `${cfg.org} ${stamp}`
  const email = `admin${stamp}@demo.example`

  // ── Intro ──────────────────────────────────────────────────────────
  await page.goto(`${base}${cfg.loginPath || '/login'}`, { waitUntil: 'networkidle2' }).catch(() => {})
  await caption(page, cfg.title, cfg.tagline)
  await sleep(3500)

  // ── Step 1: Register organization ──────────────────────────────────
  await page.goto(`${base}${cfg.registerPath || '/register-org'}`, { waitUntil: 'networkidle2' })
  await caption(page, 'Step 1 — Register your organization', 'The first person to sign up becomes the admin.')
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await sleep(700)
  await typeFirst(page, ['input[placeholder^="Acme"]', 'form input[type="text"]'], org)
  await typeFirst(page, ['input[placeholder^="Jordan"]'], 'Alex Carter')
  await typeFirst(page, ['input[placeholder*="City"]', 'input[placeholder*="Plant"]'], 'Manchester, UK', true)
  await typeFirst(page, ['input[type="email"]'], email)
  const pws = await page.$$('input[type="password"]')
  for (const el of pws) { await el.click(); await el.type('demo12345', { delay: 30 }) }
  await sleep(600)
  await clickButtonByText(page, 'Create organization')
  await page.waitForFunction(
    () => !/(register|signup|login|forgot)/.test(location.pathname),
    { timeout: 25000 },
  ).catch(() => {})
  await sleep(2500)
  await dismissCoachmarks(page)

  // ── Walkthrough of the main pages ──────────────────────────────────
  for (const stop of cfg.walkthrough) {
    await page.goto(`${base}${stop.route}`, { waitUntil: 'networkidle2' }).catch(() => {})
    await sleep(900)
    await dismissCoachmarks(page).catch(() => {})
    await caption(page, stop.title, stop.sub || '')
    await sleep(stop.dwell || 3200)
  }

  // ── Closing ────────────────────────────────────────────────────────
  if (cfg.closing) {
    await page.goto(`${base}${cfg.closing.route}`, { waitUntil: 'networkidle2' }).catch(() => {})
    await caption(page, cfg.closing.title, cfg.closing.sub || '')
    await sleep(3500)
  }
}
