import React, { useState, useEffect } from 'react'
import { Route, Routes, Navigate, useNavigate, useParams } from 'react-router-dom'
import Landing from './Landing'
import Login from './Login'
import Home from './Home'
import Profile from './Profile'
import Users from './Users'
import UsersNew from './Users/New'
import Trackings from './Trackings'
import TrackingsNew from './Trackings/New'
import TrackingDetail from './TrackingDetail'
import Places from './Places'
import PlacesNew from './Places/New'
import Backoffice from './Backoffice'
import { onSessionExpired } from '../apollo/session'
import Navbar from './Navbar'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from '../hooks/useAuth'
import { useMeQuery } from '../generated/graphql'
import { useTranslation } from 'react-i18next'

interface ProtectedRouteProps {
  isLoggedIn: boolean
  element: React.ReactElement
  allow?: boolean
  redirectTo?: string
}

function ProtectedRoute({ isLoggedIn, element, allow = true, redirectTo = '/home' }: ProtectedRouteProps) {
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!allow) return <Navigate to={redirectTo} replace />
  return element
}

interface TrackingDetailRouteProps {
  darkmode: boolean
}

function TrackingDetailRoute({ darkmode }: TrackingDetailRouteProps) {
  const { serialNumber } = useParams<{ serialNumber: string }>()
  return <TrackingDetail darkmode={darkmode} serialNumber={serialNumber ?? ''} />
}

function App() {
  const [darkmode,   setDarkmode]   = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('ui-theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!sessionStorage.getItem('userToken'))
  const { i18n } = useTranslation()

  const navigate = useNavigate()
  const { handleLogin, handleLogout } = useAuth(setIsLoggedIn)
  const { data: meData } = useMeQuery({ skip: !isLoggedIn })
  const canReadUsers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('users.read')
  )
  const canCreateUsers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('users.create')
  )
  const canUpdateUsers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('users.update')
  )
  const canCreateTrackers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('fleet.create')
  )
  const canAccessBackoffice = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    (meData?.me?.permissionKeys?.includes('companies.read') || meData?.me?.permissionKeys?.includes('users.read'))
  )

  // ── Session expiry handler ────────────────────────────────────────────────
  useEffect(() => {
    onSessionExpired(() => {
      sessionStorage.clear()
      setIsLoggedIn(false)
      toast.info(i18n.t('app.sessionExpired'))
      navigate('/login')
    })
  }, [navigate])

  useEffect(() => {
    const theme = darkmode ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ui-theme', theme)
  }, [darkmode])

  useEffect(() => {
    const userLang = meData?.me?.language
    if (userLang && i18n.language !== userLang) {
      i18n.changeLanguage(userLang)
    }
  }, [meData?.me?.language, i18n])

  // ── navigation ───────────────────────────────────────────────────────────
  const handleHome      = () => navigate('/home')
  const handlePlaces    = () => navigate('/places')
  const handleTrackings = () => navigate('/trackers')
  const handleProfile   = () => navigate('/profile')
  const handleUsers = () => navigate('/users')
  const handleBackoffice = () => navigate('/backoffice')
  const handleDarkMode  = () => setDarkmode(prev => !prev)

  // ── shorthand for protected routes ───────────────────────────────────────
  const guard = (element: React.ReactElement) =>
    <ProtectedRoute isLoggedIn={isLoggedIn} element={element} />

  const staffGuard = (element: React.ReactElement) =>
    <ProtectedRoute isLoggedIn={isLoggedIn} allow={canAccessBackoffice} element={element} />
  const usersGuard = (element: React.ReactElement) =>
    <ProtectedRoute isLoggedIn={isLoggedIn} allow={canReadUsers} element={element} />
  const usersCreateGuard = (element: React.ReactElement) =>
    <ProtectedRoute isLoggedIn={isLoggedIn} allow={canCreateUsers} element={element} />

  return (
    <div>
      {isLoggedIn && (
        <Navbar
          onHome={handleHome}
          onProfile={handleProfile}
          onUsers={handleUsers}
          showUsers={canReadUsers}
          onPlaces={handlePlaces}
          onTrackings={handleTrackings}
          onBackoffice={handleBackoffice}
          showBackoffice={canAccessBackoffice}
          onLogout={handleLogout}
        />
      )}
      <ToastContainer />
      <Routes>
        {/* ── public ── */}
        <Route path="/"         element={<Landing onLogin={() => navigate('/login')} />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<Login    onLogin={handleLogin}        onBack={() => navigate('/')} />} />

        {/* ── protected ── */}
        <Route path="/home"    element={guard(<Home darkmode={darkmode} />)} />
        <Route path="/profile" element={guard(<Profile darkmode={darkmode} onDarkMode={handleDarkMode} />)} />
        <Route path="/users" element={usersGuard(<Users canCreate={canCreateUsers} />)} />
        <Route path="/users/new" element={usersCreateGuard(<UsersNew />)} />

        <Route path="/places"     element={guard(<Places />)} />
        <Route path="/places/new" element={guard(<PlacesNew />)} />

        <Route path="/trackers"     element={guard(<Trackings />)} />
        <Route path="/trackers/new" element={guard(<TrackingsNew />)} />
        <Route
          path="/backoffice"
          element={staffGuard(
            <Backoffice
              canReadUsers={canReadUsers}
              canCreateUsers={canCreateUsers}
              canUpdateUsers={canUpdateUsers}
              canCreateTrackers={canCreateTrackers}
            />
          )}
        />

        <Route path="/detail/:serialNumber" element={guard(<TrackingDetailRoute darkmode={darkmode} />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
