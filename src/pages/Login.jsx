import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setError(error.message)
    setLoading(false)
  } else {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    if (profileData?.role === 'junkshop') navigate('/dashboard/junkshop')
    else if (profileData?.role === 'admin') navigate('/admin')
    else navigate('/dashboard/household')
  }
}

  const handleGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
}

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FEFDF8' }}>

      {/* Nav */}
      <nav className="w-full h-14 flex items-center justify-between px-4 md:px-8 bg-white border-b border-gray-100">
        <Link to="/" className="text-lg md:text-xl font-medium tracking-widest" style={{ color: '#1B4332' }}>
          WA<span style={{ color: '#E9935A' }}>I</span>Z
        </Link>
        <span className="text-xs md:text-sm text-gray-400 hidden md:inline">Baguio City's Recycling Marketplace</span>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md bg-white border border-gray-300 rounded-2xl p-6 md:p-8">

          {/* Logo */}
          <div className="text-center mb-1">
            <span className="text-xl md:text-2xl font-medium tracking-widest" style={{ color: '#1B4332' }}>
              WA<span style={{ color: '#E9935A' }}>I</span>Z
            </span>
          </div>
          <p className="text-center text-xs md:text-sm text-gray-400 mb-7">Welcome back. Log in to your account.</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">or log in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 transition"
                style={{ '--tw-ring-color': '#2D6A4F40' }}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-gray-500">Password</label>
                <button type="button" className="text-xs" style={{ color: '#2D6A4F' }}>
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition"
              style={{ backgroundColor: loading ? '#52B788' : '#2D6A4F' }}
            >
              {loading ? 'Logging in...' : 'Log in to WAIZ'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium" style={{ color: '#2D6A4F' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}