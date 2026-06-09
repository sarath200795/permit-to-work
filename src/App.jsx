import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { PermitProvider } from './context/PermitContext'
import { FullScreenLoader } from './components/ui'
import { isFirebaseConfigured } from './firebase'
import SetupNeeded from './pages/SetupNeeded'

// Route-level code splitting — each page is fetched only when navigated to.
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const RegisterOrg = lazy(() => import('./pages/RegisterOrg'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const PublicPermit = lazy(() => import('./pages/PublicPermit'))
const Legal = lazy(() => import('./pages/Legal'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Permits = lazy(() => import('./pages/Permits'))
const PermitForm = lazy(() => import('./pages/PermitForm'))
const PermitDetail = lazy(() => import('./pages/PermitDetail'))
const Approvals = lazy(() => import('./pages/Approvals'))
const Observations = lazy(() => import('./pages/Observations'))
const Users = lazy(() => import('./pages/Users'))
const Sites = lazy(() => import('./pages/Sites'))
const AuditLog = lazy(() => import('./pages/AuditLog'))

function AppShell() {
  return (
    <ProtectedRoute>
      <PermitProvider>
        <Layout />
      </PermitProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  const location = useLocation()
  if (!isFirebaseConfigured) return <SetupNeeded />
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register-org" element={<RegisterOrg />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/permit/:token" element={<PublicPermit />} />
          <Route path="/privacy" element={<Legal kind="privacy" />} />
          <Route path="/terms" element={<Legal kind="terms" />} />
          <Route path="/data-retention" element={<Legal kind="retention" />} />
          <Route path="/cookies" element={<Legal kind="cookies" />} />

          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="permits" element={<Permits />} />
            <Route path="permits/new" element={<PermitForm />} />
            <Route path="permits/:id" element={<PermitDetail />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="observations" element={<Observations />} />
            <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
            <Route path="sites" element={<ProtectedRoute adminOnly><Sites /></ProtectedRoute>} />
            <Route path="audit" element={<ProtectedRoute adminOnly><AuditLog /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
