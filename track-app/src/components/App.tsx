import React, { useState, useEffect } from 'react'
import { Route, Routes, Navigate, useNavigate, useParams } from 'react-router-dom'
import Landing from './Landing'
import Register from './Register'
import Login from './Login'
import Home from './Home'
import Profile from './Profile'
import Trackings from './Trackings'
import TrackingsNew from './Trackings/New'
import TrackingDetail from './TrackingDetail'
import Places from './Places'
import PlacesNew from './Places/New'
import { onSessionExpired } from '../apollo/session'
import Navbar from './Navbar'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  isLoggedIn: boolean
  element: React.ReactElement
}

function ProtectedRoute({ isLoggedIn, element }: ProtectedRouteProps) {
  return isLoggedIn ? element : <Navigate to="/login" replace />
}

interface TrackingDetailRouteProps {
  darkmode: boolean
}

function TrackingDetailRoute({ darkmode }: TrackingDetailRouteProps) {
  const { serialNumber } = useParams<{ serialNumber: string }>()
  return <TrackingDetail darkmode={darkmode} serialNumber={serialNumber ?? ''} />
}

function App() {
  const [darkmode,   setDarkmode]   = useState<boolean>(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!sessionStorage.getItem('userToken'))

  const navigate = useNavigate()
  const { handleLogin, handleRegister, handleLogout } = useAuth(setIsLoggedIn)

  // ── Session expiry handler ────────────────────────────────────────────────
  useEffect(() => {
    onSessionExpired(() => {
      sessionStorage.clear()
      setIsLoggedIn(false)
      toast.info('Your session has expired. Please log in again.')
      navigate('/login')
    })
  }, [navigate])

  // ── navigation ───────────────────────────────────────────────────────────
  const handleHome      = () => navigate('/home')
  const handlePlaces    = () => navigate('/places')
  const handleTrackings = () => navigate('/trackers')
  const handleProfile   = () => navigate('/profile')
  const handleDarkMode  = () => setDarkmode(prev => !prev)

  // ── shorthand for protected routes ───────────────────────────────────────
  const guard = (element: React.ReactElement) =>
    <ProtectedRoute isLoggedIn={isLoggedIn} element={element} />

  return (
    <div>
      {isLoggedIn && (
        <Navbar
          onHome={handleHome}
          onProfile={handleProfile}
          onPlaces={handlePlaces}
          onTrackings={handleTrackings}
          onLogout={handleLogout}
          onDarkMode={handleDarkMode}
          darkmode={darkmode}
        />
      )}
      <ToastContainer />
      <Routes>
        {/* ── public ── */}
        <Route path="/"         element={<Landing  onRegister={() => navigate('/register')} onLogin={() => navigate('/login')} />} />
        <Route path="/register" element={<Register onRegister={handleRegister} onBack={() => navigate('/')} />} />
        <Route path="/login"    element={<Login    onLogin={handleLogin}        onBack={() => navigate('/')} />} />

        {/* ── protected ── */}
        <Route path="/home"    element={guard(<Home darkmode={darkmode} />)} />
        <Route path="/profile" element={guard(<Profile />)} />

        <Route path="/places"     element={guard(<Places />)} />
        <Route path="/places/new" element={guard(<PlacesNew />)} />

        <Route path="/trackers"     element={guard(<Trackings />)} />
        <Route path="/trackers/new" element={guard(<TrackingsNew />)} />

        <Route path="/detail/:serialNumber" element={guard(<TrackingDetailRoute darkmode={darkmode} />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
