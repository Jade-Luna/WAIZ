import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'

const PRICE_FIELDS = [
  { key:'price_metal',      label:'Metal',      abbr:'Fe' },
  { key:'price_paper',      label:'Paper',      abbr:'Pa' },
  { key:'price_plastic',    label:'Plastic',    abbr:'Pl' },
  { key:'price_ewaste',     label:'E-waste',    abbr:'EW' },
  { key:'price_glass',      label:'Glass',      abbr:'Gl' },
  { key:'price_secondhand', label:'Secondhand', abbr:'Uk' },
]

function Stars({ rating }) {
  const r = parseFloat(rating) || 0
  return (
    <span style={{ color:'#C97A3A', fontSize:'14px' }}>
      {'★'.repeat(Math.floor(r))}{'☆'.repeat(5 - Math.floor(r))}
      <span style={{ color:'#9CA3AF', fontSize:'12px', marginLeft:'4px' }}>{r}</span>
    </span>
  )
}

export default function JunkshopProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [shop,    setShop]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchShop() }, [id])

  const fetchShop = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('junkshops')
      .select('*, profiles(full_name, phone, barangay)')
      .eq('id', id)
      .single()
    setShop(data)
    setLoading(false)
  }

  const handleMessage = () => {
    if (!user) { navigate('/login'); return }
    const role = profile?.role
    const dest = role === 'junkshop'
      ? `/dashboard/junkshop?tab=messages&contact=${id}`
      : `/dashboard/household?tab=messages&contact=${id}&title=${encodeURIComponent(shop?.shop_name || '')}`
    navigate(dest)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor:'#FEFDF8' }}>
      <div className="text-xl font-medium tracking-widest" style={{ color:'#1A4D35' }}>
        WA<span style={{ color:'#C97A3A' }}>I</span>Z
      </div>
    </div>
  )

  if (!shop) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor:'#FEFDF8' }}>
      <div className="text-center">
        <div className="text-4xl mb-3">🏪</div>
        <p className="text-gray-500 mb-4">Junkshop not found</p>
        <Link to="/junkshops" className="text-sm font-medium" style={{ color:'#1A4D35' }}>← Back to directory</Link>
      </div>
    </div>
  )

  const hasStandardRates = PRICE_FIELDS.some(f => shop[f.key] != null)
  const hasCustomRates   = shop.custom_rates && shop.custom_rates.length > 0

  return (
    <div className="min-h-screen" style={{ backgroundColor:'#FEFDF8' }}>

      {/* NAV */}
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color:'#0D2B1F' }}>
          WA<span style={{ color:'#C97A3A' }}>I</span>Z
        </Link>
        <Link to="/junkshops" className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Back to directory
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header card */}
        <div className="rounded-2xl p-6 mb-6 flex items-center justify-between gap-4"
          style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
          <div className="flex items-center gap-4">
            {/* Avatar / photo */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-xl font-medium"
              style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'#D8F3DC' }}>
              {shop.photo_url
                ? <img src={shop.photo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
                : (shop.shop_name || 'JS').slice(0,2).toUpperCase()
              }
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-medium text-white">{shop.shop_name}</h1>
                {shop.is_verified && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'#B7E4C7' }}>
                    ✓ Verified
                  </span>
                )}
                {shop.is_featured && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor:'rgba(201,122,58,0.3)', color:'#FAEEDA' }}>
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Stars rating={shop.rating} />
                <span className="text-xs" style={{ color:'#74C69D' }}>
                  📍 {shop.barangay || shop.profiles?.barangay || 'Baguio City'}
                </span>
                <span className="text-xs" style={{ color:'#74C69D' }}>
                  {shop.total_pickups || 0} pickups completed
                </span>
              </div>
            </div>
          </div>

          {/* Message button */}
          <button
            onClick={handleMessage}
            className="px-5 py-2.5 rounded-xl text-sm font-medium shrink-0 transition"
            style={{ backgroundColor:'#C97A3A', color:'#fff' }}>
            💬 Message
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">

          {/* Buying rates */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-4">Buying Rates</p>

            {/* Standard rates */}
            {hasStandardRates && (
              <div className="space-y-2 mb-4">
                {PRICE_FIELDS.map(f => shop[f.key] != null && (
                  <div key={f.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                        {f.abbr}
                      </div>
                      <span className="text-sm text-gray-600">{f.label}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>
                      ₱{shop[f.key]}/kg
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom rates */}
            {hasCustomRates && (
              <>
                {hasStandardRates && (
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Custom rates</p>
                )}
                <div className="space-y-2">
                  {shop.custom_rates.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{r.label}</span>
                      <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>₱{r.price}/kg</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!hasStandardRates && !hasCustomRates && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-300">No rates posted yet</p>
                <p className="text-xs text-gray-300 mt-1">Contact this shop directly for pricing</p>
              </div>
            )}
          </div>

          {/* Shop info */}
          <div className="space-y-4">

            {/* Details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Shop Details</p>
              <div className="space-y-2">
                {[
                  { label:'Barangay',    value: shop.barangay || shop.profiles?.barangay || '—' },
                  { label:'Contact',     value: shop.phone    || shop.profiles?.phone    || '—' },
                  { label:'Rating',      value: `★ ${shop.rating || 'No ratings yet'}`          },
                  { label:'Pickups',     value: `${shop.total_pickups || 0} completed`          },
                  { label:'Status',      value: shop.is_verified ? '✓ Verified' : 'Unverified'  },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{row.label}</span>
                    <span className="text-xs font-medium text-gray-600">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-5" style={{ backgroundColor:'#D8F3DC' }}>
              <p className="text-sm font-medium mb-1" style={{ color:'#1A4D35' }}>
                Ready to recycle?
              </p>
              <p className="text-xs mb-3" style={{ color:'#2D6A4F' }}>
                Message this junkshop to arrange a pickup or ask about rates.
              </p>
              <button
                onClick={handleMessage}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ backgroundColor:'#1A4D35' }}>
                💬 Send a message
              </button>
              {!user && (
                <Link to="/signup"
                  className="block w-full py-2.5 rounded-xl text-sm font-medium text-center mt-2"
                  style={{ backgroundColor:'#C97A3A', color:'#fff' }}>
                  Sign up to message
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}