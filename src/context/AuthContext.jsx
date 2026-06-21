import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'
import {
  createOrganization,
  createPendingMember,
  findOrgByName,
  getUserProfile,
} from '../lib/firestore'
import { isApprover as roleIsApprover, isAdmin as roleIsAdmin } from '../lib/permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // firebase auth user
  const [profile, setProfile] = useState(null) // users/{uid} doc
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async (uid) => {
    const p = await getUserProfile(uid)
    setProfile(p)
    return p
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await refreshProfile(u.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [refreshProfile])

  // Register a brand new organization; caller becomes admin.
  const registerOrganization = async ({ orgName, address, name, email, phone, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    try {
      const existing = await findOrgByName(orgName)
      if (existing) {
        throw new Error('An organization with that name already exists. Try signing up to join it.')
      }
      await updateProfile(cred.user, { displayName: name })
      await createOrganization({ orgName, address, uid: cred.user.uid, name, email, phone })
      await refreshProfile(cred.user.uid)
    } catch (err) {
      await deleteUser(cred.user).catch(() => {})
      throw err
    }
  }

  // Sign up to join an existing org (pending admin approval, default Technician).
  const signUpMember = async ({ orgId, orgName, name, email, phone, password }) => {
    if (!orgId) throw new Error('Please select your organization.')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    try {
      await updateProfile(cred.user, { displayName: name })
      await createPendingMember({ uid: cred.user.uid, name, email, phone, orgId, orgName: orgName || '' })
      await refreshProfile(cred.user.uid)
    } catch (err) {
      await deleteUser(cred.user).catch(() => {})
      throw err
    }
  }

  const login = async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await refreshProfile(cred.user.uid)
  }

  // Email the user a password-reset link. Firebase handles the reset page.
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email)
  }

  const signOut = async () => {
    await fbSignOut(auth)
    // Clear user *and* profile synchronously so the next render (which includes
    // the redirect to /login) already sees isAuthed === false. Waiting for the
    // onAuthStateChanged listener leaves auth state briefly stale-true, which
    // makes Login's "already signed in → dashboard" effect bounce the route and
    // trip the browser's navigation throttle (blank page on logout).
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    isAuthed: Boolean(user),
    isApproved: profile?.status === 'approved',
    isAdmin: roleIsAdmin(profile?.role),
    isApprover: roleIsApprover(profile?.role),
    role: profile?.role || null,
    orgId: profile?.orgId || null,
    orgName: profile?.orgName || '',
    registerOrganization,
    signUpMember,
    login,
    resetPassword,
    signOut,
    refreshProfile: () => user && refreshProfile(user.uid),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
