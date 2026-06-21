// Config-driven, narrated tutorial tour shared by the apps that follow the
// common "register org → walk the authenticated pages" pattern.

async function typeFirst(page, selectors, value, optional = false) {
  for (const sel of selectors) {
    const el = await page.$(sel)
    if (el) { await el.click(); await page.type(sel, value, { delay: 45 }); return true }
  }
  if (!optional) console.warn('  (no match for', selectors.join(' | '), ')')
  return false
}

export async function genericRun(page, ctx, cfg) {
  const { caption, say, showCard, sleep, clickButtonByText, dismissCoachmarks, base } = ctx
  const stamp = Date.now().toString().slice(-5)
  const org = `${cfg.org} ${stamp}`
  const email = `admin${stamp}@demo.example`

  // ── Welcome card ───────────────────────────────────────────────────
  await showCard(page, { kicker: 'Tutorial', title: cfg.title, subtitle: cfg.tagline })
  await say(`Welcome to ${cfg.title}. ${cfg.tagline}`)
  await say("In this short tutorial, we'll walk through how to use the app.")

  // ── Step 1: Register organization ──────────────────────────────────
  await page.goto(`${base}${cfg.registerPath || '/register-org'}`, { waitUntil: 'networkidle2' })
  await caption(page, 'Step 1 — Register your organization', 'The first person to sign up becomes the admin.')
  await say('First, register your organization. The first person to sign up becomes the administrator.')
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await typeFirst(page, ['input[placeholder^="Acme"]', 'form input[type="text"]'], org)
  await typeFirst(page, ['input[placeholder^="Jordan"]'], 'Alex Carter')
  await typeFirst(page, ['input[placeholder*="City"]', 'input[placeholder*="Plant"]'], 'Manchester, UK', true)
  await typeFirst(page, ['input[type="email"]'], email)
  const pws = await page.$$('input[type="password"]')
  for (const el of pws) { await el.click(); await el.type('demo12345', { delay: 30 }) }
  await say('Enter your details and a password, then create the organization.')
  await clickButtonByText(page, 'Create organization')
  await page.waitForFunction(
    () => !/(register|signup|login|forgot)/.test(location.pathname),
    { timeout: 25000 },
  ).catch(() => {})
  await sleep(1500)
  await dismissCoachmarks(page)

  // ── Walkthrough of the main pages ──────────────────────────────────
  for (const stop of cfg.walkthrough) {
    await page.goto(`${base}${stop.route}`, { waitUntil: 'networkidle2' }).catch(() => {})
    await sleep(800)
    await dismissCoachmarks(page).catch(() => {})
    await caption(page, stop.title, stop.sub || '')
    await say(stop.say || [stop.title, stop.sub].filter(Boolean).join('. '))
  }

  // ── Closing + Thank-you card ───────────────────────────────────────
  if (cfg.closing) {
    await page.goto(`${base}${cfg.closing.route}`, { waitUntil: 'networkidle2' }).catch(() => {})
    await caption(page, cfg.closing.title, cfg.closing.sub || '')
    await say(cfg.closing.say || [cfg.closing.title, cfg.closing.sub].filter(Boolean).join('. '))
  }
  await showCard(page, { kicker: 'Thank you', title: 'Thanks for watching', subtitle: `Get started with ${cfg.title} by registering your organization.` })
  await say(`That's a quick tour of ${cfg.title}. Thanks for watching — get started by registering your organization.`)
}
