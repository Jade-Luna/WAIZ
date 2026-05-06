import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase/config'

const BARANGAYS = [
  'Abanao-Zandueta-Kayong-Chugum-Otek','Andres Bonifacio','Aurora Hill Proper',
  'Bayan Park','Burnham-Legarda','Cabinet Hill-Teacher\'s Camp','Camp 7',
  'Camp 8','Camp Allen','Campo Filipino','City Camp Central','City Camp Proper',
  'Country Club Village','Cresencia Village','Dagsian','Dominican Hill-Mirador',
  'Dontogan','Engineers Hill','Fairview Village','Ferdinand','Fort del Pilar',
  'Gabriela Silang','General Luna Road','Gibraltar','Greenwater Village',
  'Guisad Central','Guisad Sorong','Happy Hollow','Happy Homes','Harrison Road',
  'Holy Ghost Extension','Holy Ghost Proper','Honeymoon','Irisan','Imelda Marcos',
  'Kabayanihan','Kagitingan','Kayang Extension','Kayang-Hilltop','Kias',
  'Loakan Apugan','Loakan Liwanag','Loakan Proper','Loakan Road','Lopez Jaena',
  'Lourdes Subdivision Extension','Lourdes Subdivision Proper','Lower Quirino',
  'Lualhati','Lucnab','Magsaysay Private Road','Magsaysay Lower','Magsaysay Upper',
  'Manuel A. Roxas','Market Subdivision','Middle Quezon Hill','Military Cut-off',
  'Mines View Park','Modern Site East','Modern Site West','MRR-Queen of Peace',
  'New Lucban','Outlook Drive','Pacdal','Padre Burgos','Padre Zamora',
  'Palma-Urbano','Phil-Am','Pinget','Pinsao Pilot','Pinsao Proper','Poliwes',
  'Pucsusan','Quirino Hill East','Quirino Hill Lower','Quirino Hill Middle',
  'Quirino Hill Proper','Quirino Hill West','Quirino-Magsaysay','Rock Quarry',
  'Salud Mitra','San Antonio Village','San Luis Village','San Roque Village',
  'San Vicente','Santa Escolastica','Santo Rosario','Santo Tomas Proper',
  'Santo Tomas School Area','Session Road','Sierra Vista','Slaughter House',
  'South Drive','Teodora Alonzo','Trancoville','Victoria Village'
]

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [searchParams] = useSearchParams()
const [role, setRole] = useState(searchParams.get('role') || 'household')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', barangay: '',
    shopName: '', dtiNumber: ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    setLoading(false)
navigate(role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id || data.session?.user?.id
if (userId) {
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    role,
    full_name: role === 'household'
      ? `${form.firstName} ${form.lastName}`
      : form.shopName,
    phone: form.phone,
    barangay: form.barangay,
  })

  if (profileError) {
    setError('Account created but profile setup failed. Please contact support.')
    setLoading(false)
    return
  }

  if (role === 'junkshop') {
    await supabase.from('junkshops').insert({
      id: userId,
      shop_name: form.shopName,
      dti_number: form.dtiNumber || null,
    })
  }
}

    setLoading(false)
    navigate('/login')
  }

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-600 transition"

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FEFDF8' }}>

      {/* Nav */}
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color: '#1B4332' }}>
          WA<span style={{ color: '#E9935A' }}>I</span>Z
        </Link>
        <span className="text-sm text-gray-400">Baguio City's Recycling Marketplace</span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8">

          <div className="text-center mb-1">
            <span className="text-2xl font-medium tracking-widest" style={{ color: '#1B4332' }}>
              WA<span style={{ color: '#E9935A' }}>I</span>Z
            </span>
          </div>
          <p className="text-center text-sm text-gray-400 mb-6">Create your free account</p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {[1,2,3].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                  style={{
                    backgroundColor: step === s ? '#E9935A' : step > s ? '#2D6A4F' : '#F3F4F6',
                    color: step >= s ? '#fff' : '#9CA3AF'
                  }}>
                  {step > s ? '✓' : s}
                </div>
                {i < 2 && <div className="flex-1 h-px" style={{ backgroundColor: step > s ? '#2D6A4F' : '#E5E7EB' }} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Choose role */}
          {step === 1 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">Who are you?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'household', label: 'Household', desc: 'I have recyclables to sell', icon: '🏠' },
                  { value: 'junkshop', label: 'Junkshop', desc: 'I buy recyclables', icon: '🏪' }
                ].map(opt => (
                  <div key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className="border-2 rounded-2xl p-4 text-center cursor-pointer transition"
                    style={{
                      borderColor: role === opt.value ? '#2D6A4F' : '#E5E7EB',
                      backgroundColor: role === opt.value ? '#D8F3DC' : '#fff'
                    }}
                  >
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{opt.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{opt.desc}</div>
                  </div>
                ))}
              </div>

              {role === 'junkshop' && (
                <div className="mb-4 px-4 py-3 rounded-xl text-xs" style={{ backgroundColor: '#FAEEDA', color: '#854F0B' }}>
                  Junkshop accounts are reviewed within 24 hours before activation.
                </div>
              )}

              <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition mb-3">
                <svg width="16" height="16" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">or use email</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ backgroundColor: '#2D6A4F' }}>
                Continue as {role === 'household' ? 'Household' : 'Junkshop'}
              </button>
            </div>
          )}

          {/* STEP 2 — Account details */}
          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); setStep(3) }} className="space-y-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Account details</p>

              {role === 'household' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">First name</label>
                    <input className={inputClass} placeholder="Juan" required
                      value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Last name</label>
                    <input className={inputClass} placeholder="dela Cruz" required
                      value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Junkshop name</label>
                  <input className={inputClass} placeholder="e.g. Dela Cruz Junk Shop" required
                    value={form.shopName} onChange={e => update('shopName', e.target.value)} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
                <input className={inputClass} type="email" placeholder="you@email.com" required
                  value={form.email} onChange={e => update('email', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone number</label>
                <input className={inputClass} placeholder="09XX XXX XXXX" required
                  value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>

              <div className="relative">
  <label className="block text-xs font-medium text-gray-500 mb-1.5">
    Barangay in Baguio City
  </label>
  <input
    className={inputClass}
    placeholder="Search barangay..."
    value={form.barangay}
    onChange={e => { update('barangay', e.target.value); update('_hideSuggestions', false) }}
    onBlur={() => setTimeout(() => update('_hideSuggestions', true), 150)}
    autoComplete="off"
  />
  {form.barangay.length >= 2 && !form._hideSuggestions && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ maxHeight:'180px', overflowY:'auto' }}>
      {BARANGAYS.filter(b =>
        b.toLowerCase().includes(form.barangay.toLowerCase())
      ).slice(0,6).map(b => (
        <button key={b} type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => update('barangay', b)}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition">
          {b}
        </button>
      ))}
    </div>
  )}
</div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                  Back
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: '#2D6A4F' }}>
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 — Password + submit */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {role === 'junkshop' ? 'Verification & password' : 'Set your password'}
              </p>

              {role === 'junkshop' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    DTI Registration No. <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input className={inputClass} placeholder="DTI-XXXXXXXXX"
                    value={form.dtiNumber} onChange={e => update('dtiNumber', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">Verified shops get a trust badge visible to all households.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
                <input className={inputClass} type="password" placeholder="Min. 8 characters" required
                  value={form.password} onChange={e => update('password', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm password</label>
                <input className={inputClass} type="password" placeholder="Repeat password" required
                  value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>

              {error && (
                <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                  Back
                </button>
                <button type="submit" disabled={loading || !agreedToTerms}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
                  style={{
  backgroundColor: (!agreedToTerms || loading)
    ? '#9CA3AF'
    : role === 'junkshop' ? '#E9935A' : '#2D6A4F'
}}>
                  {loading ? 'Creating...' : role === 'junkshop' ? 'Submit for Verification' : 'Create Account'}
                </button>
              </div>

              <div className="flex items-start gap-3 mt-2">
  <input
    type="checkbox"
    id="terms"
    checked={agreedToTerms}
    onChange={e => setAgreedToTerms(e.target.checked)}
    className="mt-0.5 shrink-0 w-4 h-4 cursor-pointer"
    style={{ accentColor:'#1A4D35' }}
  />
  <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
    I have read and agree to WAIZ's{' '}
    <Link to="/how-it-works" className="underline" style={{ color:'#1A4D35' }}>
      Terms of Use
    </Link>{' '}
    and{' '}
    <Link to="/how-it-works" className="underline" style={{ color:'#1A4D35' }}>
      Privacy Policy
    </Link>
  </label>
</div>
            </form>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#2D6A4F' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}