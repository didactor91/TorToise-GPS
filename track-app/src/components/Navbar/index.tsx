import { useState } from 'react'
import logo from '../../common/img/logo.png'
import './index.sass'

interface NavbarProps {
  onHome: () => void
  onProfile: () => void
  onUsers?: () => void
  showUsers?: boolean
  onPlaces: () => void
  onTrackings: () => void
  onBackoffice?: () => void
  showBackoffice?: boolean
  onLogout: () => void
  onDarkMode: () => void
  darkmode: boolean
}

function Navbar({
  onHome,
  onProfile,
  onUsers,
  showUsers = false,
  onPlaces,
  onTrackings,
  onBackoffice,
  showBackoffice = false,
  onLogout,
  onDarkMode,
  darkmode
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const toggle = () => setMenuOpen(prev => !prev)
  const close = () => setMenuOpen(false)

  return (
    <nav className="nav-home navbar is-warning">
      <div className="navbar-brand">
        <a className="navbar-item">
          <img src={logo} alt="TorToise GPS" width="100" height="40" />
        </a>
        <div
          className={`navbar-burger burger${menuOpen ? ' is-active' : ''}`}
          onClick={toggle}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div id="navibarmenu" className={`navbar-menu is-warning${menuOpen ? ' is-active' : ''}`}>
        <div className="navbar-start">
          <a className="navbar-item" onClick={() => { onHome(); close() }}>Home</a>
          <a className="navbar-item" onClick={() => { onProfile(); close() }}>Profile</a>
          {showUsers && onUsers && (
            <a className="navbar-item" onClick={() => { onUsers(); close() }}>Users</a>
          )}
          <a className="navbar-item" onClick={() => { onPlaces(); close() }}>Places</a>
          <a className="navbar-item" onClick={() => { onTrackings(); close() }}>Trackers</a>
          {showBackoffice && onBackoffice && (
            <a className="navbar-item" onClick={() => { onBackoffice(); close() }}>Backoffice</a>
          )}
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <label className="theme-switch" title="Toggle theme">
              <input
                type="checkbox"
                checked={darkmode}
                onChange={() => onDarkMode()}
                aria-label="Toggle Light/Dark theme"
              />
              <span className="theme-switch__slider" />
              <span className="theme-switch__label">{darkmode ? 'Dark' : 'Light'}</span>
            </label>
          </div>
          <div className="navbar-item">
            <a
              className="button nav-icon-button"
              onClick={() => { onLogout(); close() }}
              title="Log Out"
              aria-label="Log Out"
            >
              <span aria-hidden="true">⎋</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
