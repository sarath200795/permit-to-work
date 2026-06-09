import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShieldCheck, ClipboardCheck, HardHat, Workflow } from 'lucide-react'
import { LEGAL_PAGES } from '../lib/legal'

const FEATURES = [
  { icon: ClipboardCheck, text: 'Digital permits with hazard, PPE & precaution checklists' },
  { icon: Workflow, text: 'Dual-team approval — Engineering & Operations sign-off' },
  { icon: ShieldCheck, text: 'Live status, auto-expiry & printable permit records' },
]

/** Split-screen animated auth layout used by login / signup / register. */
export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — animated brand panel */}
      <div className="aurora relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <HardHat size={24} />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Permit to Work</span>
        </motion.div>

        <div>
          <motion.h1
            className="max-w-md text-4xl font-black leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Safe work, authorized and accountable.
          </motion.h1>
          <motion.p
            className="mt-3 max-w-md text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Raise, review and close high-risk work permits — hot work, confined space, height,
            electrical and more — with a clear approval trail across every team.
          </motion.p>

          <div className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                className="flex items-center gap-3 rounded-xl glass px-4 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
              >
                <f.icon size={18} className="text-brand-200" />
                <span className="text-sm text-white/90">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute -bottom-10 -right-10 opacity-20 animate-float"
          aria-hidden
        >
          <HardHat className="text-brand-300" size={220} />
        </motion.div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.kind} to={p.path} className="hover:text-white">{p.label}</Link>
            ))}
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Permit to Work</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-clay-bg px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <HardHat size={22} className="text-brand-500" />
            <span className="text-lg font-extrabold">Permit to Work</span>
          </div>
          {children}
          {/* Mobile legal links (the left brand panel is hidden on small screens) */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-400 lg:hidden">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.kind} to={p.path} className="hover:text-ink-700">{p.label}</Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
