import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, ResponsiveContainer, PieChart, Pie, Legend,
} from 'recharts'
import {
  LayoutDashboard, FolderOpen, CheckCircle2, TimerReset, Activity, AlertTriangle, Plus, FileText,
  XCircle, ShieldCheck, ShieldAlert, Eye,
} from 'lucide-react'
import { PageHeader, EmptyState } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { usePermits } from '../context/PermitContext'
import { subscribeObservations } from '../lib/firestore'
import { dashboardBuckets, derivePermitStatus, STATUS, STATUS_META } from '../lib/permitStatus'
import { WORK_TYPES } from '../lib/ptwData'

const TYPE_COLORS = ['#f97316', '#2563eb', '#16a34a', '#7c3aed', '#0891b2', '#dc2626']

function Kpi({ icon: Icon, label, value, color, onClick, delay }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="card pressable flex items-center gap-3 p-4 text-left"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-clay-sm" style={{ backgroundColor: color }}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black tabular-nums text-ink-900">{value}</p>
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      </div>
    </motion.button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { permits: allPermits, loading, sites } = usePermits()
  const [allObservations, setAllObservations] = useState([])
  const [site, setSite] = useState('all')

  useEffect(() => {
    if (!profile?.orgId) return undefined
    return subscribeObservations(profile.orgId, setAllObservations)
  }, [profile?.orgId])

  // Filter everything by the selected site (observations join via permitId).
  const permits = useMemo(
    () => (site === 'all' ? allPermits : allPermits.filter((p) => p.site === site)),
    [allPermits, site]
  )
  const observations = useMemo(() => {
    if (site === 'all') return allObservations
    const ids = new Set(permits.map((p) => p.id))
    return allObservations.filter((o) => ids.has(o.permitId))
  }, [allObservations, permits, site])

  const now = Date.now()
  const buckets = useMemo(() => dashboardBuckets(permits, now), [permits, now])

  const obsCounts = useMemo(() => ({
    safe: observations.filter((o) => o.type === 'safe').length,
    unsafe: observations.filter((o) => o.type === 'unsafe').length,
  }), [observations])

  const statusData = useMemo(() => {
    const order = [STATUS.DRAFT, STATUS.IN_PROGRESS, STATUS.EXTENDED_IN_PROGRESS, STATUS.EXTENDED, STATUS.NOT_CLOSED, STATUS.CLOSED, STATUS.CLOSED_NONCOMPLIANCE]
    const counts = Object.fromEntries(order.map((s) => [s, 0]))
    for (const p of permits) { const s = derivePermitStatus(p, now); if (counts[s] != null) counts[s]++ }
    return order
      .map((s) => ({ name: STATUS_META[s].label, value: counts[s], color: STATUS_META[s].color }))
      .filter((d) => d.value > 0)
  }, [permits, now])

  const typeData = useMemo(() => {
    const counts = Object.fromEntries(WORK_TYPES.map((t) => [t, 0]))
    for (const p of permits) if (counts[p.typeOfWork] != null) counts[p.typeOfWork]++
    return WORK_TYPES.map((t, i) => ({ name: t, value: counts[t], color: TYPE_COLORS[i % TYPE_COLORS.length] })).filter((d) => d.value > 0)
  }, [permits])

  const obsData = useMemo(() => [
    { name: 'Safe', value: obsCounts.safe, color: '#16a34a' },
    { name: 'Unsafe', value: obsCounts.unsafe, color: '#991b1b' },
  ].filter((d) => d.value > 0), [obsCounts])

  // Active permits (In Progress + Extended) broken down by type of work.
  const activeByType = useMemo(() => {
    const map = Object.fromEntries(WORK_TYPES.map((t) => [t, { name: t, 'In Progress': 0, Extended: 0 }]))
    for (const p of permits) {
      if (map[p.typeOfWork] == null) continue
      const s = derivePermitStatus(p, now)
      if (s === STATUS.IN_PROGRESS) map[p.typeOfWork]['In Progress']++
      else if (s === STATUS.EXTENDED || s === STATUS.EXTENDED_IN_PROGRESS) map[p.typeOfWork].Extended++
    }
    return WORK_TYPES.map((t) => map[t]).filter((d) => d['In Progress'] + d.Extended > 0)
  }, [permits, now])

  const KPIS = [
    { icon: FolderOpen, label: 'Open', value: buckets.open, color: '#64748b', to: '/app/permits' },
    { icon: Activity, label: 'In Progress', value: buckets.inProgress, color: '#2563eb', to: '/app/permits' },
    { icon: TimerReset, label: 'Extended', value: buckets.extended, color: '#7c3aed', to: '/app/permits' },
    { icon: AlertTriangle, label: 'Not Closed', value: buckets.notClosed, color: '#dc2626', to: '/app/permits' },
    { icon: XCircle, label: 'Rejected', value: buckets.rejected, color: '#e11d48', to: '/app/permits' },
    { icon: CheckCircle2, label: 'Closed', value: buckets.closed, color: '#334155', to: '/app/permits' },
    { icon: ShieldCheck, label: 'Safe Obs.', value: obsCounts.safe, color: '#16a34a', to: '/app/observations' },
    { icon: ShieldAlert, label: 'Unsafe Obs.', value: obsCounts.unsafe, color: '#991b1b', to: '/app/observations' },
  ]

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle={`Permit overview · ${profile?.orgName || ''}`}>
        {sites.length > 0 && (
          <select className="input w-auto" value={site} onChange={(e) => setSite(e.target.value)} title="Filter by site">
            <option value="all">All sites</option>
            {sites.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button className="btn-primary" onClick={() => navigate('/app/permits/new')}><Plus size={16} /> New Permit</button>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPIS.map((k, i) => (
          <Kpi key={k.label} {...k} delay={i * 0.04} onClick={() => navigate(k.to)} />
        ))}
      </div>

      {loading ? null : permits.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={FileText} title="No permits yet" hint="Raise your first permit to populate the dashboard."
            action={<button className="btn-primary mt-1" onClick={() => navigate('/app/permits/new')}><Plus size={16} /> New Permit</button>} />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* By status */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
            <h2 className="mb-4 text-base font-bold text-ink-900">Permits by status</h2>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} tick={{ fill: '#62718c' }} angle={-12} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} tick={{ fill: '#62718c' }} />
                  <Tooltip cursor={{ fill: 'rgba(228,205,191,0.35)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} onClick={() => navigate('/app/permits')} className="cursor-pointer">
                    {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    <LabelList dataKey="value" position="top" fontSize={13} fontWeight={800} fill="#1c2230" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* By type of work */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
            <h2 className="mb-4 text-base font-bold text-ink-900">By type of work</h2>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={3}>
                    {typeData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Not Closed breakdown — extended vs never-extended */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink-900"><AlertTriangle size={18} className="text-red-600" /> Not Closed breakdown</h2>
            {buckets.notClosed === 0 ? (
              <div className="grid place-items-center py-10 text-sm text-ink-400">No expired permits 🎉</div>
            ) : (
              <div className="space-y-3">
                <button onClick={() => navigate('/app/permits')} className="flex w-full items-center gap-3 rounded-2xl bg-clay-surface p-4 text-left shadow-clay-inset transition hover:bg-clay-100">
                  <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: '#7c3aed' }}><TimerReset size={18} /></div>
                  <div className="flex-1">
                    <p className="text-2xl font-black tabular-nums text-ink-900">{buckets.notClosedExtended}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Expired after extension</p>
                  </div>
                </button>
                <button onClick={() => navigate('/app/permits')} className="flex w-full items-center gap-3 rounded-2xl bg-clay-surface p-4 text-left shadow-clay-inset transition hover:bg-clay-100">
                  <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: '#dc2626' }}><AlertTriangle size={18} /></div>
                  <div className="flex-1">
                    <p className="text-2xl font-black tabular-nums text-ink-900">{buckets.notClosedPlain}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Expired without extension</p>
                  </div>
                </button>
                {/* segmented bar */}
                <div className="flex h-2.5 overflow-hidden rounded-full bg-clay-100">
                  <div style={{ width: `${(buckets.notClosedExtended / buckets.notClosed) * 100}%`, backgroundColor: '#7c3aed' }} />
                  <div style={{ width: `${(buckets.notClosedPlain / buckets.notClosed) * 100}%`, backgroundColor: '#dc2626' }} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Observations (Safe vs Unsafe) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900"><Eye size={18} className="text-brand-600" /> Safety observations</h2>
              <button className="btn-ghost" onClick={() => navigate('/app/observations')}>View all</button>
            </div>
            <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl bg-clay-surface p-4 shadow-clay-inset">
                  <div className="flex items-center gap-2 text-green-700"><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-wide">Safe</span></div>
                  <p className="mt-1 text-3xl font-black tabular-nums text-ink-900">{obsCounts.safe}</p>
                </div>
                <div className="flex-1 rounded-2xl bg-clay-surface p-4 shadow-clay-inset">
                  <div className="flex items-center gap-2" style={{ color: '#991b1b' }}><ShieldAlert size={18} /><span className="text-xs font-bold uppercase tracking-wide">Unsafe</span></div>
                  <p className="mt-1 text-3xl font-black tabular-nums text-ink-900">{obsCounts.unsafe}</p>
                  <p className="text-[11px] text-red-600">closes permit (non-compliance)</p>
                </div>
              </div>
              <div style={{ height: 180 }}>
                {obsData.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-ink-400">No observations yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={obsData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {obsData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>

          {/* In Progress & Extended breakdown by type of work */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900"><Activity size={18} className="text-brand-600" /> Active permits by type</h2>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#2563eb' }} /> In Progress · {buckets.inProgress}</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#7c3aed' }} /> Extended · {buckets.extended}</span>
              </div>
            </div>
            {activeByType.length === 0 ? (
              <div className="grid place-items-center py-10 text-sm text-ink-400">No active permits right now</div>
            ) : (
              <div style={{ height: Math.max(160, activeByType.length * 46) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={activeByType} margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barCategoryGap="25%">
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#62718c' }} />
                    <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#1c2230' }} />
                    <Tooltip cursor={{ fill: 'rgba(228,205,191,0.35)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="In Progress" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} onClick={() => navigate('/app/permits')} className="cursor-pointer">
                      <LabelList dataKey="In Progress" position="center" fontSize={11} fontWeight={800} fill="#fff" formatter={(v) => (v > 0 ? v : '')} />
                    </Bar>
                    <Bar dataKey="Extended" stackId="a" fill="#7c3aed" radius={[0, 4, 4, 0]} onClick={() => navigate('/app/permits')} className="cursor-pointer">
                      <LabelList dataKey="Extended" position="center" fontSize={11} fontWeight={800} fill="#fff" formatter={(v) => (v > 0 ? v : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
