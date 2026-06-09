import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HardHat, MapPin, Calendar, User, ShieldAlert, ListChecks, Table, Clock, LogIn,
  CheckCircle2, AlertTriangle, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Spinner, Modal, Field } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { subscribePermitByToken, createObservation } from '../lib/firestore'
import { derivePermitStatus, effectiveValidTo, statusMeta, STATUS } from '../lib/permitStatus'

const fmt = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Live "Xh Ym Zs" remaining, or an expired/closed message. */
function useCountdown(permit) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return useMemo(() => {
    if (!permit) return null
    const status = derivePermitStatus(permit, now)
    const to = Date.parse(effectiveValidTo(permit))
    const remaining = Number.isNaN(to) ? null : to - now
    return { status, remaining }
  }, [permit, now])
}

function Remaining({ ms }) {
  if (ms == null) return <span>—</span>
  if (ms <= 0) return <span>Time elapsed</span>
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return <span className="tabular-nums">{h}h {String(m).padStart(2, '0')}m {String(sec).padStart(2, '0')}s</span>
}

function Chips({ items }) {
  if (!items?.length) return <span className="text-sm text-white/50">None</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => <span key={t} className="chip bg-white/10 text-white/90">{t}</span>)}
    </div>
  )
}

export default function PublicPermit() {
  const { token } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthed, profile, isApproved } = useAuth()
  const [permit, setPermit] = useState(undefined) // undefined = loading, null = not found
  const [obsOpen, setObsOpen] = useState(false)
  const [obs, setObs] = useState({ type: 'safe', note: '' })
  const [busy, setBusy] = useState(false)
  const autoOpenedRef = useRef(false)

  useEffect(() => {
    if (!token) return undefined
    return subscribePermitByToken(token, setPermit, () => setPermit(null))
  }, [token])

  // Arrived back from the QR "log in to add observation" flow (?observe=1) — as
  // soon as we're a signed-in member of the permit's org, open the form.
  const wantsObserve = new URLSearchParams(location.search).get('observe') === '1'
  useEffect(() => {
    if (autoOpenedRef.current || !wantsObserve || !permit) return
    const member = isAuthed && isApproved && profile?.orgId === permit.orgId
    const closed = [STATUS.CLOSED, STATUS.CLOSED_NONCOMPLIANCE].includes(derivePermitStatus(permit))
    if (member && !closed) {
      autoOpenedRef.current = true
      setObs({ type: 'safe', note: '' })
      setObsOpen(true)
    }
  }, [wantsObserve, permit, isAuthed, isApproved, profile])

  const cd = useCountdown(permit)

  if (permit === undefined) {
    return <div className="aurora grid min-h-screen place-items-center text-white"><Spinner size={30} /></div>
  }
  if (permit === null) {
    return (
      <div className="aurora grid min-h-screen place-items-center p-6 text-center text-white">
        <div className="rounded-3xl glass p-8">
          <AlertTriangle className="mx-auto mb-3 text-amber-300" size={32} />
          <h1 className="text-xl font-extrabold">Permit not found</h1>
          <p className="mt-1 text-white/70">This QR code is invalid or the permit was removed.</p>
        </div>
      </div>
    )
  }

  const meta = statusMeta(cd.status)
  const isMember = isAuthed && isApproved && profile?.orgId === permit.orgId
  const isClosedState = [STATUS.CLOSED, STATUS.CLOSED_NONCOMPLIANCE].includes(cd.status)

  const onLogObservation = () => {
    if (!isAuthed) {
      // Come back to THIS permit and auto-open the observation form after login.
      navigate('/login', { state: { from: { pathname: location.pathname, search: '?observe=1' } } })
      return
    }
    setObs({ type: 'safe', note: '' })
    setObsOpen(true)
  }

  const submitObs = async () => {
    setBusy(true)
    try {
      const actor = { uid: profile.uid, name: profile.name, orgName: profile.orgName, role: profile.role }
      await createObservation(permit.orgId, {
        permitId: permit.permitId, permitNo: permit.permitNo, token, type: obs.type, note: obs.note, source: 'qr',
      }, actor)
      toast.success(obs.type === 'unsafe' ? 'Logged — permit closed for non-compliance' : 'Safe observation logged')
      setObsOpen(false)
    } catch (e) {
      toast.error(e.message || 'Could not log observation')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="aurora min-h-screen p-4 text-white sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-2">
          <HardHat size={22} className="text-brand-300" />
          <span className="font-extrabold">Permit to Work</span>
          <span className="ml-auto text-xs text-white/60">{permit.orgName}</span>
        </div>

        {/* Status + countdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl glass p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">{permit.permitNo}</p>
              <h1 className="text-2xl font-black">{permit.typeOfWork}</h1>
            </div>
            <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: meta.color }}>{meta.label}</span>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
            <Clock size={20} className="text-brand-200" />
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">Time remaining</p>
              <p className="text-lg font-bold"><Remaining ms={cd.remaining} /></p>
            </div>
            <div className="ml-auto text-right text-xs text-white/60">
              <p>Valid from {fmt(permit.validFrom)}</p>
              <p>Valid to {fmt(permit.validTo)}</p>
            </div>
          </div>
        </motion.div>

        {/* Details */}
        <div className="mt-4 space-y-3 rounded-3xl glass p-6 text-sm">
          <p className="flex items-center gap-2"><MapPin size={15} className="text-white/50" /> {permit.site ? `${permit.site} · ` : ''}{permit.jobLocation || '—'}</p>
          <p className="flex items-center gap-2"><User size={15} className="text-white/50" /> Issued to {permit.issuedToName || '—'}</p>
          <p className="flex items-center gap-2"><Calendar size={15} className="text-white/50" /> {permit.date} {permit.time}</p>
          {permit.jobDescription && <p className="text-white/80">{permit.jobDescription}</p>}
          <div><p className="mb-1 flex items-center gap-2 font-semibold"><ShieldAlert size={15} /> Hazards</p><Chips items={permit.hazards} /></div>
          <div><p className="mb-1 flex items-center gap-2 font-semibold"><ListChecks size={15} /> Precautions</p><Chips items={permit.precautions} /></div>
          {permit.jsa?.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-2 font-semibold"><Table size={15} /> Job Safety Analysis</p>
              <div className="overflow-hidden rounded-xl border border-white/15">
                {permit.jsa.map((r, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 border-b border-white/10 p-2 text-xs last:border-0">
                    <span>{r.step}</span><span className="text-white/70">{r.hazard}</span><span className="text-white/70">{r.precaution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Observation CTA */}
        <div className="mt-4 rounded-3xl glass p-6">
          {permit.closedDueToObservation && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-100">
              <AlertTriangle size={16} /> Closed for non-compliance — {permit.closedDueToObservation.note || 'unsafe condition reported'}
            </div>
          )}
          <p className="mb-3 text-sm text-white/70">Spotted something? Log a safety observation for this permit.</p>
          {!isAuthed ? (
            <button className="btn bg-white text-ink-900 hover:bg-white/90" onClick={onLogObservation}>
              <LogIn size={16} /> Log in to add observation
            </button>
          ) : isMember ? (
            <button className="btn-primary" onClick={onLogObservation} disabled={isClosedState}>
              {isClosedState ? 'Permit already closed' : 'Log an observation'}
            </button>
          ) : (
            <p className="text-sm text-amber-200">You must be an approved member of <strong>{permit.orgName}</strong> to log an observation.</p>
          )}
          <p className="mt-3 text-xs text-white/40">
            <Link to="/login" className="inline-flex items-center gap-1 hover:text-white/70">Open the portal <ExternalLink size={11} /></Link>
          </p>
        </div>
      </div>

      {/* Observation modal */}
      <Modal open={obsOpen} onClose={() => setObsOpen(false)} title="Log safety observation">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setObs({ ...obs, type: 'safe' })}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-sm font-bold transition ${obs.type === 'safe' ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-clay-surface text-ink-500'}`}>
              <CheckCircle2 size={18} /> Safe
            </button>
            <button type="button" onClick={() => setObs({ ...obs, type: 'unsafe' })}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-sm font-bold transition ${obs.type === 'unsafe' ? 'border-red-600 bg-red-50 text-red-700' : 'border-transparent bg-clay-surface text-ink-500'}`}>
              <AlertTriangle size={18} /> Unsafe
            </button>
          </div>
          <Field label="Observation note">
            <textarea rows={3} className="input" placeholder="Describe what you observed…" value={obs.note} onChange={(e) => setObs({ ...obs, note: e.target.value })} />
          </Field>
          {obs.type === 'unsafe' && (
            <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              <AlertTriangle size={14} /> An unsafe observation will immediately close this permit (Non-Compliance).
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setObsOpen(false)}>Cancel</button>
          <button className={obs.type === 'unsafe' ? 'btn-danger' : 'btn-primary'} onClick={submitObs} disabled={busy}>
            {busy ? <Spinner size={18} /> : obs.type === 'unsafe' ? 'Log & close permit' : 'Log observation'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
