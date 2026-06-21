import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users as UsersIcon, Check, X, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, EmptyState, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { usePermits } from '../context/PermitContext'
import { setUserStatus, setUserRole } from '../lib/firestore'
import { ROLE_OPTIONS, roleMeta } from '../lib/permissions'

export default function Users() {
  const { user, profile } = useAuth()
  const { users } = usePermits()
  const [busyId, setBusyId] = useState(null)

  const actor = { uid: user.uid, name: profile?.name || '' }
  const orgId = profile.orgId

  const pending = users.filter((u) => u.status === 'pending')
  const approved = users.filter((u) => u.status === 'approved')

  const approve = (u) => act(u, () => setUserStatus(u.uid, 'approved', orgId, actor, u.name))
  const reject = (u) => act(u, () => setUserStatus(u.uid, 'rejected', orgId, actor, u.name))
  const changeRole = (u, role) => act(u, () => setUserRole(u.uid, role, orgId, actor, u.name))

  async function act(u, fn) {
    setBusyId(u.uid)
    try { await fn(); toast.success('Updated') } catch (e) { toast.error(e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <PageHeader icon={UsersIcon} title="Users" subtitle="Approve teammates and assign their role" tourId="users-header" />

      {/* Pending approvals */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">Pending approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState icon={Check} title="No pending requests" hint="New sign-ups will appear here for approval." />
        ) : (
          <div className="space-y-2.5">
            {pending.map((u) => (
              <motion.div key={u.uid} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                  {(u.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-900">{u.name}</p>
                  <p className="flex flex-wrap gap-x-3 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                    {u.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {u.phone}</span>}
                  </p>
                </div>
                <select className="input w-44" defaultValue="" disabled={busyId === u.uid}
                  onChange={(e) => e.target.value && changeRole(u, e.target.value)}>
                  <option value="" disabled>Assign role…</option>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => approve(u)} disabled={busyId === u.uid}>
                    {busyId === u.uid ? <Spinner size={16} /> : <><Check size={15} /> Approve</>}
                  </button>
                  <button className="btn-danger" onClick={() => reject(u)} disabled={busyId === u.uid}><X size={15} /> Reject</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Approved members */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">Members ({approved.length})</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-clay-200/70 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((u) => {
                const rm = roleMeta(u.role)
                const self = u.uid === user.uid
                return (
                  <tr key={u.uid} className="border-b border-clay-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{u.name} {self && <span className="text-xs text-ink-400">(you)</span>}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      <p>{u.email}</p>
                      {u.phone && <p className="text-xs">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <select className="input w-44" value={u.role} disabled={busyId === u.uid || self}
                        onChange={(e) => changeRole(u, e.target.value)}
                        style={{ color: rm.color, fontWeight: 600 }}>
                        {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-400">You can't change your own role. Engineering & Operations can approve, close and extend permits; Technicians can only raise permits.</p>
      </div>
    </div>
  )
}
