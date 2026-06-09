import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '../components/AuthShell'
import { Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { authErrorMessage } from '../lib/authErrors'

// Only follow `from` for in-app deep links (e.g. the QR observation flow);
// otherwise always land on the dashboard.
const targetFrom = (from) => (from && /^\/(app|permit)\b/.test(from) ? from : '/app/dashboard')

export default function Login() {
  const { login, loading, isAuthed, isApproved } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)

  // Already signed in & approved? Don't show the form — go to the dashboard.
  // (Pending users are routed to /pending by ProtectedRoute.)
  useEffect(() => {
    if (loading || !isAuthed || !isApproved) return
    navigate(targetFrom(location.state?.from?.pathname), { replace: true })
  }, [loading, isAuthed, isApproved, navigate, location.state])

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate(targetFrom(location.state?.from?.pathname), { replace: true })
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink-900">Sign in</h2>
      <p className="mt-1 text-sm text-ink-500">Access your organization's permit portal.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              required
              autoComplete="email"
              className="input pl-9"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input pl-9"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner size={18} /> : (<>Sign in <ArrowRight size={16} /></>)}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-ink-500">
        <p>
          New teammate?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
            Join your organization
          </Link>
        </p>
        <p>
          Setting up a new company?{' '}
          <Link to="/register-org" className="font-semibold text-brand-600 hover:underline">
            Register an organization
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
