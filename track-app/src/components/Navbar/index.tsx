import React, { useState } from 'react'
import logo from '../../common/img/logo.png'
import './index.sass'

interface NavbarProps {
  onHome: () => void
  onProfile: () => void
  onPlaces: () => void
  onTrackings: () => void
  onLogout: () => void
  onDarkMode: () => void
}

function Navbar({ onHome, onProfile, onPlaces, onTrackings, onLogout, onDarkMode }: NavbarProps) {
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
          <a className="navbar-item" onClick={() => { onPlaces(); close() }}>Places</a>
          <a className="navbar-item" onClick={() => { onTrackings(); close() }}>Trackers</a>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <a className="button is-dark is-outlined is-rounded" onClick={() => { onDarkMode(); close() }}>
              <span>Dark Map</span>
            </a>
          </div>
          <div className="navbar-item">
            <a className="button is-dark is-outlined is-rounded" onClick={() => { onLogout(); close() }}>
              <span>Log Out</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
