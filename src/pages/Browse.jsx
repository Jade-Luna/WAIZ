import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { key: 'all',        label: 'All'        },
  { key: 'metal',      label: 'Metal'      },
  { key: 'paper',      label: 'Paper'      },
  { key: 'plastic',    label: 'Plastic'    },
  { key: 'ewaste',     label: 'E-waste'    },
  { key: 'glass',      label: 'Glass'      },
  { key: 'secondhand', label: 'Secondhand' },
  { key: 'others',     label: 'Others'     },
]

const STATUS_COLORS = {
  available:  { bg: '#D8F3DC', color: '#085041' },
  pending:    { bg: '#FAEEDA', color: '#854F0B' },
  completed:  { bg: '#F3F4F6', color: '#6B7280' },
}

const CAT_COLORS = {
  metal:      { bg: '#E1F5EE', color: '#085041' },
  paper:      { bg: '#EAF3DE', color: '#173404' },
  plastic:    { bg: '#E6F1FB', color: '#042C53' },
  ewaste:     { bg: '#FAEEDA', color: '#412402' },
  glass:      { bg: '#EEEDFE', color: '#26215C' },
  secondhand: { bg: '#FBEAF0', color: '#4B1528' },
}

const BARANGAYS = [
  'All barangays','Burnham-Legarda','Cabinet Hill','Camp 7','Irisan',
  'Loakan Proper','Mines View','Pinsao Proper','Quirino Hill','Session Road',
  'Trancoville','Holy Ghost','Engineers Hill','Pacdal','Guisad',
]


function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

export default function Browse() {
  const { user, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [listings, setListings]     = useState([])
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState(searchParams.get('category') || 'all')
  const [barangay, setBarangay]     = useState('All barangays')
  const [sortBy, setSortBy]         = useState('newest')
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    fetchListings()
  }, [category, barangay, sortBy])

  const fetchListings = async () => {
  setLoading(true)
  let query = supabase
    .from('listings')
    .select('*, profiles(full_name)')
    .in('status', ['available', 'pending'])

  if (category !== 'all') query = query.eq('category', category)
  if (barangay !== 'All barangays') query = query.eq('barangay', barangay)
  if (sortBy === 'newest')   query = query.order('created_at',      { ascending: false })
  if (sortBy === 'heaviest') query = query.order('weight_estimate',  { ascending: false })

  const { data } = await query
  if (!data) { setListings([]); setLoading(false); return }

 // Put current user's listings first
  if (user) {
    const mine  = data.filter(l => l.posted_by === user.id)
    const others = data.filter(l => l.posted_by !== user.id)
    setListings([...mine, ...others])
  } else {
    setListings(data)
  }
  setLoading(false)
}

  const filtered = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFDF8' }}>

      {/* NAV */}
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color: '#1B4332' }}>
          WA<span style={{ color: '#E9935A' }}>I</span>Z
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/browse"    className="text-sm font-medium" style={{ color: '#2D6A4F' }}>Browse</Link>
          <Link to="/junkshops" className="text-sm text-gray-500 hover:text-gray-700 transition">Junkshops</Link>
          <div className="w-px h-5 bg-gray-200" />
          {user ? (
            <Link
              to={profile?.role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household'}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: '#2D6A4F' }}>
              Dashboard
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"  className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Log in</Link>
              <Link to="/signup" className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#2D6A4F' }}>Sign up</Link>
            </div>
          )}
        </div>
      </nav>
          
      {/* Login prompt for non-users */}
{!user && (
  <div className="max-w-6xl mx-auto px-8 py-4">
    <div className="rounded-xl px-5 py-3 flex items-center justify-between"
      style={{ backgroundColor:'#D8F3DC' }}>
      <p className="text-sm" style={{ color:'#1A4D35' }}>
        🌿 Sign in to contact households and send pickup requests
      </p>
      <div className="flex gap-2">
        <Link to="/login"
          className="text-xs px-4 py-1.5 rounded-lg border font-medium"
          style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
          Log in
        </Link>
        <Link to="/signup"
          className="text-xs px-4 py-1.5 rounded-lg font-medium text-white"
          style={{ backgroundColor:'#1A4D35' }}>
          Sign up
        </Link>
      </div>
    </div>
  </div>
)}
      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: '#52B788' }}>Browse Listings</div>
          <h1 className="text-3xl font-medium text-gray-800">Available items in Baguio City</h1>
          <p className="text-sm text-gray-400 mt-1">Find recyclables, scrap, and secondhand items posted by Baguio households</p>
        </div>

        {/* Search + Filters */}
        <div className="bg-white border border-gray-300 rounded-2xl p-5 mb-6">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M11 11l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                className="flex-1 text-sm outline-none bg-transparent text-gray-600 placeholder-gray-300"
                placeholder="  Search listings..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Barangay filter */}
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none"
              value={barangay}
              onChange={e => setBarangay(e.target.value)}>
              {BARANGAYS.map(b => <option key={b}>{b}</option>)}
            </select>

            {/* Sort */}
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="heaviest">Heaviest first</option>
            </select>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.key}
                onClick={() => setCategory(cat.key)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  backgroundColor: category === cat.key ? '#2D6A4F' : '#F3F4F6',
                  color:           category === cat.key ? '#fff'     : '#6B7280',
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {loading ? 'Loading...' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} found`}
          </p>
          {user && profile?.role === 'household' && (
            <Link to="/post-item"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: '#E9935A' }}>
              + Post an item
            </Link>
          )}
        </div>

        {/* Listings grid */}
        {filtered.length === 0 ? (
  <div className="text-center py-24 border-4 border-dashed border-gray-500 rounded-2xl">
    <div className="text-5xl mb-4">♻️</div>
    <p className="text-base font-medium text-gray-500 mb-1">No listings yet</p>
    <p className="text-sm text-gray-400 mb-5">
      {loading ? 'Loading listings...' : 'Be the first to post a recyclable item in Baguio City'}
    </p>
    <Link to="/signup"
      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
      style={{ backgroundColor:'#1A4D35' }}>
      Post your first item
    </Link>
  </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(listing => {
  const catColor    = CAT_COLORS[listing.category] || CAT_COLORS.metal
  const statusStyle = STATUS_COLORS[listing.status] || STATUS_COLORS.available
const statusLabel = {
  available: 'Available',
  pending:   'Pickup pending',
}[listing.status] || 'Available'
  const isOwner     = user?.id === listing.posted_by

  return (
    <div key={listing.id}
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-green-200 hover:shadow-sm transition cursor-pointer">

      {/* Image */}
      <div className="h-40 relative overflow-hidden"
        style={{ backgroundColor: catColor.bg }}>
        {listing.photos && listing.photos.length > 0 ? (
          <img src={listing.photos[0]} alt={listing.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-medium"
              style={{ backgroundColor: catColor.bg, color: catColor.color, border:`2px solid ${catColor.color}22` }}>
              {listing.category?.slice(0,2).toUpperCase()}
            </div>
          </div>
        )}
        <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
          {statusLabel}
        </span>
        {isOwner && (
          <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-white text-gray-500">
            Your listing
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide mb-1"
          style={{ color: catColor.color }}>
          {listing.category}
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-1 leading-snug">{listing.title}</h3>

        {/* Seller info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: catColor.bg, color: catColor.color }}>
            {(listing.profiles?.full_name || 'U').slice(0,1)}
          </div>
          <span className="text-xs text-gray-400">
            {listing.profiles?.full_name || 'Household'} · {listing.barangay}
          </span>
        </div>

        {listing.weight_estimate && (
          <p className="text-xs text-gray-400 mb-3">~{listing.weight_estimate} kg</p>
        )}

        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <span className="text-xs text-gray-300">{timeAgo(listing.created_at)}</span>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {/* Edit button for owner */}
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/listing/${listing.id}/edit`) }}
                className="text-xs px-2.5 py-1 rounded-lg border"
                style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
                Edit
              </button>
            )}
            {/* Message button for junkshops */}
            {user && profile?.role === 'junkshop' && !isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/dashboard/junkshop?tab=messages&contact=${listing.posted_by}&listing=${listing.id}&title=${encodeURIComponent(listing.title)}`)
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor:'#1A4D35' }}
                title="Message household">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})}
          </div>
        )}
      </div>
    </div>
  )
}