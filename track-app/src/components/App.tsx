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
import PlacesEdit from './Places/Edit'
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

type BackofficeSection = 'companies' | 'users' | 'trackers'

function normalizeBackofficeSection(section?: string): BackofficeSection {
  if (section === 'users' || section === 'trackers') return section
  return 'companies'
}

function TrackingDetailRoute({ darkmode }: TrackingDetailRouteProps) {
  const { serialNumber } = useParams<{ serialNumber: string }>()
  return <TrackingDetail darkmode={darkmode} serialNumber={serialNumber ?? ''} />
}

interface BackofficeRouteProps {
  mode: 'index' | 'create' | 'edit'
  canReadCompanies: boolean
  canCreateCompanies: boolean
  canUpdateCompanies: boolean
  canReadUsers: boolean
  canCreateUsers: boolean
  canUpdateUsers: boolean
  canDeleteUsers: boolean
  canReadTrackers: boolean
  canUpdateTrackers: boolean
  canCreateTrackers: boolean
  canDeleteTrackers: boolean
}

function BackofficeRoute({
  mode,
  canReadCompanies,
  canCreateCompanies,
  canUpdateCompanies,
  canReadUsers,
  canCreateUsers,
  canUpdateUsers,
  canDeleteUsers,
  canReadTrackers,
  canUpdateTrackers,
  canCreateTrackers,
  canDeleteTrackers
}: BackofficeRouteProps) {
  const { section, entityId } = useParams<{ section: string, entityId?: string }>()
  const normalizedSection = normalizeBackofficeSection(section)
  if (section !== normalizedSection) return <Navigate to="/backoffice/companies" replace />
  if (mode === 'edit' && !entityId) return <Navigate to={`/backoffice/${normalizedSection}`} replace />

  return (
    <Backoffice
      section={normalizedSection}
      mode={mode}
      entityId={entityId}
      canReadCompanies={canReadCompanies}
      canCreateCompanies={canCreateCompanies}
      canUpdateCompanies={canUpdateCompanies}
      canReadUsers={canReadUsers}
      canCreateUsers={canCreateUsers}
      canUpdateUsers={canUpdateUsers}
      canDeleteUsers={canDeleteUsers}
      canReadTrackers={canReadTrackers}
      canUpdateTrackers={canUpdateTrackers}
      canCreateTrackers={canCreateTrackers}
      canDeleteTrackers={canDeleteTrackers}
    />
  )
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
  const canDeleteUsers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('users.delete')
  )
  const canReadCompanies = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('companies.read')
  )
  const canCreateCompanies = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('companies.create')
  )
  const canUpdateCompanies = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('companies.update')
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
  const canReadTrackers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('fleet.read')
  )
  const canUpdateTrackers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('fleet.update')
  )
  const canDeleteTrackers = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    meData?.me?.permissionKeys?.includes('fleet.delete')
  )
  const canAccessBackoffice = Boolean(
    meData?.me?.featureKeys?.includes('backoffice') &&
    (
      meData?.me?.permissionKeys?.includes('companies.read') ||
      meData?.me?.permissionKeys?.includes('companies.create') ||
      meData?.me?.permissionKeys?.includes('companies.update') ||
      meData?.me?.permissionKeys?.includes('users.read') ||
      meData?.me?.permissionKeys?.includes('users.create') ||
      meData?.me?.permissionKeys?.includes('users.update') ||
      meData?.me?.permissionKeys?.includes('users.delete') ||
      meData?.me?.permissionKeys?.includes('fleet.read') ||
      meData?.me?.permissionKeys?.includes('fleet.create') ||
      meData?.me?.permissionKeys?.includes('fleet.update') ||
      meData?.me?.permissionKeys?.includes('fleet.delete')
    )
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
  const handleBackoffice = () => navigate('/backoffice/companies')
  const handleBackofficeCompanies = () => navigate('/backoffice/companies')
  const handleBackofficeUsers = () => navigate('/backoffice/users')
  const handleBackofficeTrackers = () => navigate('/backoffice/trackers')
  const handleExitBackoffice = () => navigate('/home')
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
          onBackofficeCompanies={handleBackofficeCompanies}
          onBackofficeUsers={handleBackofficeUsers}
          onBackofficeTrackers={handleBackofficeTrackers}
          showBackofficeUsers={canReadUsers || canCreateUsers || canUpdateUsers}
          showBackofficeTrackers={canReadTrackers || canUpdateTrackers || canCreateTrackers}
          onExitBackoffice={handleExitBackoffice}
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
        <Route path="/places/:poiId" element={guard(<PlacesEdit />)} />

        <Route path="/trackers"     element={guard(<Trackings />)} />
        <Route path="/trackers/new" element={guard(<TrackingsNew />)} />
        <Route path="/backoffice" element={<Navigate to="/backoffice/companies" replace />} />
        <Route
          path="/backoffice/:section"
          element={staffGuard(
            <BackofficeRoute
              mode="index"
              canReadCompanies={canReadCompanies}
              canCreateCompanies={canCreateCompanies}
              canUpdateCompanies={canUpdateCompanies}
              canReadUsers={canReadUsers}
              canCreateUsers={canCreateUsers}
              canUpdateUsers={canUpdateUsers}
              canDeleteUsers={canDeleteUsers}
              canReadTrackers={canReadTrackers}
              canUpdateTrackers={canUpdateTrackers}
              canCreateTrackers={canCreateTrackers}
              canDeleteTrackers={canDeleteTrackers}
            />
          )}
        />
        <Route
          path="/backoffice/:section/new"
          element={staffGuard(
            <BackofficeRoute
              mode="create"
              canReadCompanies={canReadCompanies}
              canCreateCompanies={canCreateCompanies}
              canUpdateCompanies={canUpdateCompanies}
              canReadUsers={canReadUsers}
              canCreateUsers={canCreateUsers}
              canUpdateUsers={canUpdateUsers}
              canDeleteUsers={canDeleteUsers}
              canReadTrackers={canReadTrackers}
              canUpdateTrackers={canUpdateTrackers}
              canCreateTrackers={canCreateTrackers}
              canDeleteTrackers={canDeleteTrackers}
            />
          )}
        />
        <Route
          path="/backoffice/:section/:entityId"
          element={staffGuard(
            <BackofficeRoute
              mode="edit"
              canReadCompanies={canReadCompanies}
              canCreateCompanies={canCreateCompanies}
              canUpdateCompanies={canUpdateCompanies}
              canReadUsers={canReadUsers}
              canCreateUsers={canCreateUsers}
              canUpdateUsers={canUpdateUsers}
              canDeleteUsers={canDeleteUsers}
              canReadTrackers={canReadTrackers}
              canUpdateTrackers={canUpdateTrackers}
              canCreateTrackers={canCreateTrackers}
              canDeleteTrackers={canDeleteTrackers}
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
