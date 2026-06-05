import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader, EmptyState, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { usePermits } from '../context/PermitContext'
import { updateOrgSites } from '../lib/firestore'

export default function Sites() {
  const { user, profile } = useAuth()
  const { sites, org } = usePermits()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const actor = { uid: user.uid, name: profile?.name || '' }
  const orgId = profile.orgId

  const save = async (next) => {
    setBusy(true)
    try {
      await updateOrgSites(orgId, next, actor)
      toast.success('Sites updated')
    } catch (e) {
      toast.error(e.message || 'Could not update sites')
    } finally {
      setBusy(false)
    }
  }

  const add = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (sites.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return toast.error('That site already exists')
    }
    await save([...sites, trimmed])
    setName('')
  }

  const remove = (site) => save(sites.filter((s) => s !== site))

  return (
    <div>
      <PageHeader icon={MapPin} title="Sites" subtitle={`Work sites for ${org?.name || 'your organization'}`} />

      <div className="card mb-5 p-5">
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Add a site (e.g. Plant 1 — Chennai)" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Spinner size={18} /> : (<><Plus size={16} /> Add site</>)}
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-400">Sites appear as a dropdown when raising a permit and as a filter on the dashboard.</p>
      </div>

      {sites.length === 0 ? (
        <EmptyState icon={MapPin} title="No sites yet" hint="Add your first work site above." />
      ) : (
        <div className="space-y-2">
          {sites.map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="card flex items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 shadow-clay-sm"><MapPin size={18} /></div>
              <span className="flex-1 font-semibold text-ink-900">{s}</span>
              <button onClick={() => remove(s)} disabled={busy} className="rounded-lg p-2 text-ink-400 hover:text-red-600" title="Remove site"><Trash2 size={16} /></button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
