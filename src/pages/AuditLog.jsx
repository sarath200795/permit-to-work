import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { PageHeader, EmptyState, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { subscribeAuditLogs } from '../lib/firestore'
import { auditMeta } from '../lib/audit'

const fmt = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AuditLog() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    if (!profile?.orgId) return
    const unsub = subscribeAuditLogs(profile.orgId, setLogs)
    return unsub
  }, [profile?.orgId])

  return (
    <div>
      <PageHeader icon={ScrollText} title="Audit Log" subtitle="Every action across your organization's permits" />

      {logs === null ? (
        <div className="grid place-items-center py-20"><Spinner size={28} /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" hint="Actions will be recorded here as permits are raised and reviewed." />
      ) : (
        <div className="space-y-2">
          {logs.map((l, i) => {
            const m = auditMeta(l.action)
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.01, 0.2) }}
                className="card flex items-center gap-3 p-3.5">
                <span className="chip shrink-0" style={{ backgroundColor: `${m.color}1a`, color: m.color }}>{m.label}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-800">
                    <span className="font-semibold">{l.actorName}</span>
                    {l.targetLabel ? <span className="text-ink-500"> · {l.targetLabel}</span> : null}
                    {l.summary ? <span className="text-ink-500"> — {l.summary}</span> : null}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-400">{fmt(l.at)}</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
