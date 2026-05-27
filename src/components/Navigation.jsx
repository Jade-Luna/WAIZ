import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X } from 'lucide-react'

export default function Navigation() {
  const { user, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'relative',
      zIndex: 50,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      minHeight: '56px',
      borderBottom: '1px solid rgba(255,255,255,0.25)',
      backdropFilter: 'blur(4px)',
      backgroundColor: 'rgba(10,26,12,0.8)',
    }}>

      <style>{`
        .nav-desktop { display: none; }
        .nav-mobile-btn { display: flex; }
        @media (min-width: 768px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-btn { display: none !important; }
        }
      `}</style>

      {/* Logo */}
      <Link to="/" style={{
        fontFamily: 'Georgia, serif',
        fontSize: 'clamp(18px, 4vw, 22px)',
        fontWeight: 700,
        color: '#a8e898',
        letterSpacing: '2px',
        textDecoration: 'none',
        flexShrink: 0,
      }}>
        WA<span style={{ color: '#c8a84e' }}>I</span>Z
      </Link>

      {/* Desktop Menu */}
      <div className="nav-desktop" style={{ alignItems: 'center', gap: 24 }}>
        <Link to="/how-it-works" style={{
          fontSize: 13, fontWeight: 500, textDecoration: 'none',
          color: isActive('/how-it-works') ? '#fff' : '#a8d898',
        }}>How It Works</Link>

        <Link to="/about" style={{
          fontSize: 13, fontWeight: 500, textDecoration: 'none',
          color: isActive('/about') ? '#fff' : '#a8d898',
        }}>About</Link>

        <Link to="/junkshops" style={{
          fontSize: 13, fontWeight: 500, textDecoration: 'none',
          color: isActive('/junkshops') ? '#fff' : '#a8d898',
        }}>Junkshops</Link>

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
        className="nav-mobile-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#a8e898', padding: '8px', marginRight: '-8px',
        }}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '56px', left: 0, right: 0,
          backgroundColor: 'rgba(10,26,12,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.25)',
          flexDirection: 'column',
          display: 'flex',
          padding: '16px',
          gap: '8px',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}>
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)}
            style={{ color: '#a8d898', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 14 }}>
            How It Works
          </Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}
            style={{ color: '#a8d898', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 14 }}>
            About
          </Link>
          <Link to="/junkshops" onClick={() => setMenuOpen(false)}
            style={{ color: '#a8d898', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 14 }}>
            Junkshops
          </Link>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '4px 0' }} />

          {user ? (
            <Link
              to={profile?.role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household'}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '10px 16px', borderRadius: 8,
                textAlign: 'center', fontWeight: 600, fontSize: 14,
                background: '#a8e898', color: '#0a1a0c', textDecoration: 'none',
              }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '10px 16px', borderRadius: 8,
                  textAlign: 'center', fontSize: 14,
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: '#a8d898', textDecoration: 'none',
                }}>
                Log in
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '10px 16px', borderRadius: 8,
                  textAlign: 'center', fontWeight: 600, fontSize: 14,
                  background: '#a8e898', color: '#0a1a0c', textDecoration: 'none',
                }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
