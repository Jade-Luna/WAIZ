import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X } from 'lucide-react'

export default function Navigation() {
  const { user, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const navLinkClass = (path) => {
    const baseClass = 'transition text-sm font-medium'
    const isActive = location.pathname === path
    return isActive
      ? `${baseClass} text-white`
      : `${baseClass} text-gray-300 hover:text-white`
  }

  return (
    <nav style={{
      position: 'relative', zIndex: 50,
      width: '100%', height: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px md:px-8',
      minHeight: '56px',
      borderBottom: '1px solid rgba(255,255,255,0.25)',
      backdropFilter: 'blur(4px)',
      backgroundColor: 'rgba(10,26,12,0.8)',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        fontFamily: 'Georgia, serif', fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700,
        color: '#a8e898', letterSpacing: '2px', textDecoration: 'none', flexShrink: 0,
      }}>
        WA<span style={{ color: '#c8a84e' }}>I</span>Z
      </Link>

      {/* Desktop Menu */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        '@media (max-width: 768px)': { display: 'none' }
      }} className="hidden md:flex">
        <Link to="/how-it-works" className={navLinkClass('/how-it-works')}>How It Works</Link>
        <Link to="/about" className={navLinkClass('/about')}>About</Link>
        <Link to="/junkshops" className={navLinkClass('/junkshops')}>Junkshops</Link>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.35)' }} />
        {user ? (
          <Link
            to={profile?.role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household'}
            style={{
              fontSize: 13, fontWeight: 600, color: '#0a1a0c',
              background: '#a8e898', padding: '7px 18px',
              borderRadius: 99, textDecoration: 'none',
            }}>
            Dashboard
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/login" style={{
              fontSize: 13, color: '#a8d898',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '6px 16px', borderRadius: 99, textDecoration: 'none',
            }}>Log in</Link>
            <Link to="/signup" style={{
              fontSize: 13, fontWeight: 600, color: '#0a1a0c',
              background: '#a8e898', padding: '7px 18px',
              borderRadius: 99, textDecoration: 'none',
            }}>Sign up</Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#a8e898', padding: '8px', marginRight: '-8px'
        }}
        className="md:hidden"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '56px', left: 0, right: 0,
          backgroundColor: 'rgba(10,26,12,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', flexDirection: 'column',
          padding: '16px',
          gap: '8px',
          backdropFilter: 'blur(4px)',
        }} className="md:hidden">
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm rounded-lg hover:bg-gray-700 transition"
            style={{ color: '#a8d898', textDecoration: 'none' }}>How It Works</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm rounded-lg hover:bg-gray-700 transition"
            style={{ color: '#a8d898', textDecoration: 'none' }}>About</Link>
          <Link to="/junkshops" onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm rounded-lg hover:bg-gray-700 transition"
            style={{ color: '#a8d898', textDecoration: 'none' }}>Junkshops</Link>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '8px 0' }} />
          {user ? (
            <Link
              to={profile?.role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household'}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm rounded-lg text-center font-medium transition"
              style={{ background: '#a8e898', color: '#0a1a0c', textDecoration: 'none' }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm rounded-lg text-center border transition"
                style={{ color: '#a8d898', borderColor: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Log in</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm rounded-lg text-center font-medium transition"
                style={{ background: '#a8e898', color: '#0a1a0c', textDecoration: 'none' }}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
