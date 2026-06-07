// Vercel Serverless Function — AI fallback for the Permit to Work Safety Bot
// ("Sam"). The API key stays server-side (set GEMINI_API_KEY in Vercel env, NOT a
// VITE_* var, so it is never shipped to the browser). The client posts a
// question + a compact, data-only snapshot of the org's permit figures; we ask
// the LLM to answer briefly using ONLY that data. If no key is configured or the
// upstream fails, we return a non-200 so the client cleanly falls back to rules.
//
// Default provider: Google Gemini (free tier). To use OpenAI instead, set
// OPENAI_API_KEY and swap the call in `askOpenAI` below (template provided).

const GEMINI_MODEL = 'gemini-1.5-flash'

function systemPrompt(context) {
  return [
    'You are Sam, a friendly workplace-safety assistant inside a Permit to Work',
    '(PTW) app for high-risk work — hot work, confined space, work at height,',
    'electrical work, excavation and loading/unloading of hazardous material.',
    'Answer the user briefly and concretely (2–5 sentences, plain text, no markdown',
    'headings).',
    "Use ONLY the JSON data provided below — it is the live state of the user's",
    'organization (permits, statuses, approvals, observations, sites, work types,',
    'team). If the answer is not in the data, say so plainly and suggest what they',
    'could check or record. Never invent numbers, names, or facts.',
    'PTW terms: a permit is "Draft" until BOTH Engineering and Operations approve it;',
    'then it is "Approved & Work in Progress" within its 8-hour window, "Extended"',
    'if a time extension was approved, "Not Closed / Expired" once the window lapses',
    'without closure, or "Closed" when both teams approve closure. A safety',
    'observation is logged via QR scan or in-app; an "Unsafe" observation closes the',
    'permit for non-compliance. Closure and extension each need both teams to approve.',
    'If the question is general permit-to-work / safety guidance (not about the',
    "user's specific data), give a brief, practical, correct answer AND cite HSE",
    'guidance on permit-to-work systems (HSG250) with the URL',
    'https://www.hse.gov.uk/pubns/books/hsg250.htm (for confined spaces cite L101 /',
    'INDG258; for hot work INDG297; for work at height the Work at Height Regulations',
    '2005; for excavation HSG185; for electrical the Electricity at Work Regulations',
    '1989).',
    'This tool assists with documentation and authorisation; it does not verify',
    'physical site conditions — remind the user to verify controls on site when relevant.',
    '',
    'DATA (JSON):',
    JSON.stringify(context || {}),
  ].join('\n')
}

async function askGemini(key, question, context) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`
  const body = {
    system_instruction: { parts: [{ text: systemPrompt(context) }] },
    contents: [{ role: 'user', parts: [{ text: question }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`gemini ${r.status}`)
  const d = await r.json()
  const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim()
  if (!text) throw new Error('gemini empty')
  return text
}

// Optional OpenAI alternative — uncomment + set OPENAI_API_KEY to use:
// async function askOpenAI(key, question, context) {
//   const r = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
//     body: JSON.stringify({
//       model: 'gpt-4o-mini',
//       temperature: 0.3,
//       max_tokens: 400,
//       messages: [
//         { role: 'system', content: systemPrompt(context) },
//         { role: 'user', content: question },
//       ],
//     }),
//   })
//   if (!r.ok) throw new Error(`openai ${r.status}`)
//   const d = await r.json()
//   const text = d?.choices?.[0]?.message?.content?.trim()
//   if (!text) throw new Error('openai empty')
//   return text
// }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const geminiKey = process.env.GEMINI_API_KEY
  // const openaiKey = process.env.OPENAI_API_KEY
  if (!geminiKey /* && !openaiKey */) {
    res.status(501).json({ error: 'unconfigured' })
    return
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const question = String(payload.question || '').slice(0, 1000).trim()
    const context = payload.context || {}
    if (!question) {
      res.status(400).json({ error: 'no_question' })
      return
    }
    const answer = await askGemini(geminiKey, question, context)
    res.status(200).json({ answer })
  } catch (err) {
    res.status(502).json({ error: 'upstream_failed', detail: String(err?.message || err) })
  }
}
