import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell from '../components/AuthShell'
import { Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { authErrorMessage } from '../lib/authErrors'

// Only follow `from` for in-app deep links (e.g. the QR observation flow);
// otherwise always land on the dashboard. Preserves the query string so the
// observation intent (?observe=1) survives the round-trip.
const targetFrom = (from) => {
  const path = from?.pathname
  if (path && /^\/(app|permit)\b/.test(path)) return `${path}${from.search || ''}`
  return '/app/dashboard'
}

export default function Login() {
  const { login, resetPassword, loading, isAuthed, isApproved } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  // 'signin' shows the login form; 'reset' shows the forgot-password form.
  const [mode, setMode] = useState('signin')
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // Already signed in & approved? Don't show the form — go to the dashboard.
  // (Pending users are routed to /pending by ProtectedRoute.)
  useEffect(() => {
    if (loading || !isAuthed || !isApproved) return
    navigate(targetFrom(location.state?.from), { replace: true })
  }, [loading, isAuthed, isApproved, navigate, location.state])

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate(targetFrom(location.state?.from), { replace: true })
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // Open the reset view, carrying over whatever email was already typed.
  const openReset = () => {
    setResetEmail(form.email)
    setResetSent(false)
    setMode('reset')
  }

  const backToSignIn = () => {
    setMode('signin')
    setResetSent(false)
  }

  const onReset = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err) {
      // Don't reveal whether an email is registered — show the same neutral
      // confirmation. Surface only genuine problems (bad email, rate limits…).
      if (err?.code === 'auth/user-not-found') {
        setResetSent(true)
      } else {
        toast.error(authErrorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'reset') {
    return (
      <AuthShell>
        <h2 className="text-3xl font-extrabold tracking-tight text-ink-900">Reset password</h2>
        <p className="mt-1 text-sm text-ink-500">
          Enter your email and we'll send you a link to set a new password.
        </p>

        {resetSent ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
              <p>
                If an account exists for <span className="font-semibold">{resetEmail}</span>, a
                reset link is on its way. Check your inbox (and spam folder).
              </p>
            </div>
            <button type="button" onClick={backToSignIn} className="btn-primary w-full">
              <ArrowLeft size={16} /> Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={onReset} className="mt-8 space-y-4">
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
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? <Spinner size={18} /> : (<>Send reset link <ArrowRight size={16} /></>)}
            </button>

            <button
              type="button"
              onClick={backToSignIn}
              className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-700"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </form>
        )}
      </AuthShell>
    )
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
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <button
              type="button"
              onClick={openReset}
              className="mb-1 text-xs font-semibold text-brand-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
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
