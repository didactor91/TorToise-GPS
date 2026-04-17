import { useEffect, useState } from 'react'
import logo from '../../common/img/logo.png'
import { ArrowLeft, ArrowRight, LogOut, Menu } from 'iconoir-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
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
  onBackofficeCompanies?: () => void
  onBackofficeUsers?: () => void
  onBackofficeTrackers?: () => void
  showBackofficeUsers?: boolean
  showBackofficeTrackers?: boolean
  onExitBackoffice?: () => void
  onLogout: () => void
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
  onBackofficeCompanies,
  onBackofficeUsers,
  onBackofficeTrackers,
  showBackofficeUsers = false,
  showBackofficeTrackers = false,
  onExitBackoffice,
  onLogout
}: NavbarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [desktopMinimized, setDesktopMinimized] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })

  const toggle = () => setMenuOpen(prev => !prev)
  const close = () => setMenuOpen(false)
  const toggleDesktopMinimized = () => setDesktopMinimized(prev => !prev)
  const canMinimize = !isMobile && location.pathname.startsWith('/home')
  const isBackofficeMode = showBackoffice && location.pathname.startsWith('/backoffice')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  useEffect(() => {
    if (!canMinimize) setDesktopMinimized(false)
  }, [canMinimize])

  useEffect(() => {
    const root = document.documentElement
    const minimized = desktopMinimized && canMinimize
    root.classList.toggle('nav-minimized', minimized)
    return () => {
      root.classList.remove('nav-minimized')
    }
  }, [desktopMinimized, canMinimize])

  const menuVisible = isMobile ? menuOpen : (canMinimize ? !desktopMinimized : true)

  return (
    <nav
      className={`nav-home flex items-center px-3 ${desktopMinimized && !isMobile ? 'nav-home--minimized' : ''} ${!canMinimize ? 'nav-home--no-collapse' : ''} ${isBackofficeMode ? 'nav-home--backoffice' : ''}`}
    >
      <button className="nav-home__brand inline-flex items-center rounded-lg px-3 py-2" type="button" onClick={() => { onHome(); close() }}>
        <img src={logo} alt={t('app.brandName')} width="100" height="40" />
      </button>
      {isMobile && (
        <button
          className={`ml-auto flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1.5${menuOpen ? ' menu-open' : ''}`}
          type="button"
          aria-label={t('nav.toggleMenu')}
          onClick={toggle}
          style={{ color: 'var(--text-primary)' }}
        >
          <Menu width="22" height="22" strokeWidth={1.75} />
        </button>
      )}

      <div
        id="navibarmenu"
        className={`nav-home__menu ${menuVisible ? 'nav-home__menu--visible' : 'nav-home__menu--hidden'} ${isMobile ? 'nav-home__menu--mobile' : 'nav-home__menu--desktop'}`}
      >
        <div className="nav-home__links flex flex-col gap-1 md:flex-row md:items-center md:gap-0">
          {!isBackofficeMode && (
            <>
              <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onHome(); close() }} type="button">{t('nav.home')}</button>
              <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onProfile(); close() }} type="button">{t('nav.profile')}</button>
              {showUsers && onUsers && (
                <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onUsers(); close() }} type="button">{t('nav.users')}</button>
              )}
              <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onPlaces(); close() }} type="button">{t('nav.places')}</button>
              <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onTrackings(); close() }} type="button">{t('nav.trackers')}</button>
              {showBackoffice && onBackoffice && (
                <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onBackoffice(); close() }} type="button">{t('nav.backoffice')}</button>
              )}
            </>
          )}
          {isBackofficeMode && (
            <>
              {onBackofficeCompanies && (
                <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onBackofficeCompanies(); close() }} type="button">{t('backoffice.companies')}</button>
              )}
              {showBackofficeUsers && onBackofficeUsers && (
                <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onBackofficeUsers(); close() }} type="button">{t('backoffice.users')}</button>
              )}
              {showBackofficeTrackers && onBackofficeTrackers && (
                <button className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => { onBackofficeTrackers(); close() }} type="button">{t('trackers.title')}</button>
              )}
              {onExitBackoffice && (
                <button
                  className="inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-semibold"
                  onClick={() => { onExitBackoffice(); close() }}
                  type="button"
                >
                  {t('nav.exitBackoffice')}
                </button>
              )}
            </>
          )}
        </div>

        <div className="nav-home__actions flex flex-col gap-1 md:flex-row md:items-center md:gap-0">
          <div className="inline-flex items-center px-3 py-2 text-sm font-semibold">
            <button
              className="nav-icon-button"
              onClick={() => { onLogout(); close() }}
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
              type="button"
            >
              <LogOut width="20" height="20" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
      {canMinimize && (
        <button
          className="nav-home__collapse-toggle"
          type="button"
          onClick={toggleDesktopMinimized}
          aria-label={desktopMinimized ? t('nav.expand') : t('nav.minimize')}
          title={desktopMinimized ? t('nav.expand') : t('nav.minimize')}
        >
          {desktopMinimized
            ? <ArrowRight width="20" height="20" strokeWidth={1.8} />
            : <ArrowLeft width="20" height="20" strokeWidth={1.8} />
          }
        </button>
      )}
    </nav>
  )
}

export default Navbar
