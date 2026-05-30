import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import EcoChat from './components/EcoChat'
import AdminPanel from './pages/admin/AdminPanel'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Browse from './pages/Browse'
import PostItem from './pages/PostItem'
import Junkshops from './pages/Junkshops'
import HouseholdDash from './pages/dashboard/HouseholdDash'
import JunkshopDash from './pages/dashboard/JunkshopDash'
import HowItWorks from './pages/HowItWorks'
import ListingDetail from './pages/ListingDetail'
import EditListing from './pages/EditListing'
import JunkshopProfile from './pages/JunkshopProfile'
import { supabase } from './supabase/config'
import ChooseRole from './pages/ChooseRole'
import ContactModal from './components/ContactModal'
import { useState } from 'react'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

const RoleGuard = () => {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (user && profile && !profile.role) {
    return <Navigate to="/choose-role" replace />
  }
  return null
}

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-medium tracking-widest" style={{ color:'#1A4D35' }}>
        WA<span style={{ color:'#C97A3A' }}>I</span>Z
      </div>
    </div>
  )

  if (user && profile && !profile.role) {
  return <Navigate to="/choose-role" />
}

  if (!user) return <Navigate to="/login" replace />

  // Suspended account check
  if (profile?.is_banned) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4"
      style={{ backgroundColor:'#FEFDF8' }}>
      <div className="text-2xl font-medium tracking-widest" style={{ color:'#1A4D35' }}>
        WA<span style={{ color:'#C97A3A' }}>I</span>Z
      </div>
      <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-3">🚫</div>
        <h2 className="text-lg font-medium text-gray-800 mb-2">Account Suspended</h2>
        <p className="text-sm text-gray-400 mb-5">
          Your account has been suspended. Please contact <a href="mailto:supportwaiz@gmail.com" style={{ color:'#1A4D35' }}>support@waiz.ph</a> if you believe this is a mistake.
        </p>
        <button onClick={() => supabase.auth.signOut()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor:'#1A4D35' }}>
          Sign out
        </button>
      </div>
    </div>
  )

  if (allowedRole && profile?.role !== allowedRole) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />
    if (profile?.role === 'junkshop') return <Navigate to="/dashboard/junkshop" replace />
    return <Navigate to="/dashboard/household" replace />
  }
  return children
}

function ContactSupport() {
  const [show, setShow] = useState(false)
  
  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 40,
      }}>
        {/* Subtle help button */}
        <button
          onClick={() => setShow(true)}
          title="Support"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(26, 77, 53, 0.8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a8e898',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1'
            e.target.style.backgroundColor = '#1A4D35'
            e.target.style.boxShadow = '0 4px 12px rgba(26, 77, 53, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.7'
            e.target.style.backgroundColor = 'rgba(26, 77, 53, 0.8)'
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
          ?
        </button>
      </div>
      
      {show && <ContactModal onClose={() => setShow(false)} />}
    </>
  )
}

const AppRoutes = () => {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-medium tracking-widest" style={{ color:'#1A4D35' }}>
        WA<span style={{ color:'#C97A3A' }}>I</span>Z
      </div>
    </div>
  )

const dashRedirect = profile?.role === 'junkshop'
  ? '/dashboard/junkshop'
  : profile?.role === 'admin'
  ? '/admin'
  : '/dashboard/household'

  return (
  <>
    <RoleGuard />
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/about" element={<About />} />
      <Route path="/browse"    element={<Browse />} />
      <Route path="/junkshops" element={<Junkshops />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/junkshop/:id" element={<JunkshopProfile />} />
      <Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
      <Route path="/post-item" element={
        <ProtectedRoute allowedRole="household"><PostItem /></ProtectedRoute>
      } />
      <Route path="/listing/:id" element={<ListingDetail />} />
      <Route path="/listing/:id/edit" element={
        
  
  
  <ProtectedRoute allowedRole="household"><EditListing /></ProtectedRoute>
} />
      <Route path="/dashboard/household" element={
        <ProtectedRoute allowedRole="household"><HouseholdDash /></ProtectedRoute>
      } />
      <Route path="/dashboard/junkshop" element={
        <ProtectedRoute allowedRole="junkshop"><JunkshopDash /></ProtectedRoute>
      } />
      <Route path="/admin" element={
  <ProtectedRoute allowedRole="admin"><AdminPanel /></ProtectedRoute>
} />
    </Routes>
    <EcoChat />
    <ContactSupport />
  </>
)
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}