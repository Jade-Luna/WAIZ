import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'

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
  const [barangayInput,       setBarangayInput]       = useState('')
const [barangaySuggestions, setBarangaySuggestions] = useState([])
const [barangayOpen,        setBarangayOpen]        = useState(false)
  const [sortBy, setSortBy]         = useState('newest')
  const [loading, setLoading]       = useState(false)
  const [reportId,      setReportId]      = useState(null)
const [reportReason,  setReportReason]  = useState('')
const [reportSending, setReportSending] = useState(false)
const [reportSent,    setReportSent]    = useState(false)


  useEffect(() => {
    fetchListings()
  }, [category, barangay, sortBy])

  const ALL_BARANGAYS = [
  'Abanao-Zandueta-Kayong-Chugum-Otek','Andres Bonifacio','Aurora Hill Proper',
  'Bayan Park','Burnham-Legarda','Cabinet Hill-Teacher\'s Camp','Camp 7',
  'Camp 8','Camp Allen','Campo Filipino','City Camp Central','City Camp Proper',
  'Country Club Village','Cresencia Village','Dagsian','Dominican Hill-Mirador',
  'Dontogan','Engineers Hill','Fairview Village','Ferdinand','Fort del Pilar',
  'Gabriela Silang','General Luna Road','Gibraltar','Greenwater Village',
  'Guisad Central','Guisad Sorong','Happy Hollow','Happy Homes','Harrison Road',
  'Holy Ghost Extension','Holy Ghost Proper','Honeymoon','Irisan',
  'Kabayanihan','Kagitingan','Kayang Extension','Kayang-Hilltop','Kias',
  'Loakan Apugan','Loakan Liwanag','Loakan Proper','Loakan Road','Lopez Jaena',
  'Lourdes Subdivision Extension','Lourdes Subdivision Proper','Lower Quirino Hill',
  'Lualhati','Lucnab','Magsaysay Private Road','Magsaysay Lower','Magsaysay Upper',
  'Manuel A. Roxas','Market Subdivision','Middle Quezon Hill','Military Cut-off',
  'Mines View Park','Modern Site East','Modern Site West','MRR-Queen of Peace',
  'New Lucban','Outlook Drive','Pacdal','Padre Burgos','Padre Zamora',
  'Palma-Urbano','Phil-Am','Pinget','Pinsao Pilot','Pinsao Proper','Poliwes',
  'Pucsusan','Quirino Hill East','Quirino Hill Lower','Quirino Hill Middle',
  'Quirino Hill Proper','Quirino Hill West','Quirino-Magsaysay','Rock Quarry',
  'Salud Mitra','San Antonio Village','San Luis Village','San Roque Village',
  'San Vicente','Santa Escolastica','Santo Rosario','Santo Tomas Proper',
  'Santo Tomas School Area','Session Road','Sierra Vista','Slaughter House Area',
  'South Drive','Teodora Alonzo','Trancoville','Victoria Village',
]

 const handleReport = (id) => {
  setReportId(id)
  setReportReason('')
  setReportSent(false)
}

const submitReport = async () => {
  if (!reportReason.trim()) return
  setReportSending(true)
  await supabase.from('reports').insert({
    listing_id:  reportId,
    reported_by: user.id,
    reason:      reportReason,
  })
  setReportSending(false)
  setReportSent(true)
  setTimeout(() => { setReportId(null); setReportSent(false) }, 2000)
}

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
    <div className="min-h-screen" style={{ backgroundColor: '#EEF4EA', backgroundImage: 'radial-gradient(circle at 1px 1px, #d4e6ce 1px, transparent 0)', backgroundSize: '24px 24px' }}>

      {/* NAV */}
      <Navigation />
          
      {/* Login prompt for non-users */}
{!user && (
  <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4">
    <div className="rounded-xl px-3 md:px-5 py-2.5 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
      style={{ backgroundColor:'#D8F3DC' }}>
      <p className="text-xs md:text-sm" style={{ color:'#1A4D35' }}>
        🌿 Sign in to contact households and send pickup requests
      </p>
      <div className="flex gap-2 shrink-0">
        <Link to="/login"
          className="text-xs px-3 md:px-4 py-1.5 rounded-lg border font-medium"
          style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
          Log in
        </Link>
        <Link to="/signup"
          className="text-xs px-3 md:px-4 py-1.5 rounded-lg font-medium text-white"
          style={{ backgroundColor:'#1A4D35' }}>
          Sign up
        </Link>
      </div>
    </div>
  </div>
)}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: '#52B788' }}>Browse Listings</div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-800">Available items in Baguio City</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Find recyclables, scrap, and secondhand items posted by Baguio households</p>
<div className="flex items-center gap-4 mt-4">
  <span className="text-xs px-3 py-1.5 rounded-full font-medium"
    style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
     Baguio City
  </span>
  <span className="text-xs px-3 py-1.5 rounded-full font-medium"
    style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
     {filtered.length} items available
  </span>
</div>
        </div>

        {/* Search + Filters */}
        <div className="rounded-2xl p-4 md:p-5 mb-6" style={{ backgroundColor:'#fff', border:'1.5px solid #d1e8c8', boxShadow:'0 2px 12px rgba(45,90,39,0.07)' }}>
          <div className="flex gap-2 md:gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 md:px-3 py-2 flex-1 min-w-40">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M11 11l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                className="flex-1 text-xs md:text-sm outline-none bg-transparent text-gray-600 placeholder-gray-300"
                placeholder="Search listings..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Barangay filter */}
            <div className="relative">
  <input
    className="border border-gray-200 rounded-xl px-2 md:px-3 py-2 text-xs md:text-sm text-gray-600 outline-none w-32 md:w-48"
    placeholder="All barangays..."
    value={barangayInput}
    onChange={e => {
      const val = e.target.value
      setBarangayInput(val)
      setBarangayOpen(true)
      if (!val.trim()) {
        setBarangay('All barangays')
        setBarangaySuggestions([])
        return
      }
      setBarangaySuggestions(
        ALL_BARANGAYS.filter(b =>
          b.toLowerCase().startsWith(val.toLowerCase())
        ).slice(0, 6)
      )
    }}
    onFocus={() => {
      if (barangayInput) setBarangayOpen(true)
    }}
  />
  {barangayOpen && barangaySuggestions.length > 0 && (
    <div className="absolute z-50 w-40 md:w-64 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ maxHeight:'200px', overflowY:'auto' }}>
      <button
        onClick={() => {
          setBarangay('All barangays')
          setBarangayInput('')
          setBarangaySuggestions([])
          setBarangayOpen(false)
        }}
        className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100">
        All barangays
      </button>
      {barangaySuggestions.map(b => (
        <button key={b}
          onClick={() => {
            setBarangay(b)
            setBarangayInput(b)
            setBarangaySuggestions([])
            setBarangayOpen(false)
          }}
          className="w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-600 hover:bg-green-50 transition">
          {b}
        </button>
      ))}
    </div>
  )}
</div>

            {/* Sort */}
            <select
              className="border border-gray-200 rounded-xl px-2 md:px-3 py-2 text-xs md:text-sm text-gray-600 outline-none"
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
  className="rounded-2xl overflow-hidden cursor-pointer"
  style={{ background:'#fff', border:'1.5px solid #e4ede0', boxShadow:'0 2px 8px rgba(45,90,39,0.06)', transition:'all 0.2s' }}
  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 28px rgba(45,90,39,0.13)'; e.currentTarget.style.borderColor=catColor.color+'55'; e.currentTarget.style.transform='translateY(-2px)' }}
  onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 8px rgba(45,90,39,0.06)'; e.currentTarget.style.borderColor='#e4ede0'; e.currentTarget.style.transform='translateY(0)' }}>

      {/* Image */}
      <div className="h-44 relative overflow-hidden"
  style={{ backgroundColor: catColor.bg }}>
        {listing.photos && listing.photos.length > 0 ? (
          <img src={listing.photos[0]} alt={listing.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: catColor.color+'18', color: catColor.color, border:`1.5px solid ${catColor.color}30` }}>
              {listing.category?.slice(0,2).toUpperCase()}
            </div>
            <span className="text-xs font-medium" style={{ color: catColor.color+'99' }}>No photo</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between"
          style={{ background:'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}>
          <span className="text-xs font-semibold text-white uppercase tracking-wide">{listing.category}</span>
          {listing.weight_estimate && (
            <span className="text-xs font-medium text-white opacity-90">~{listing.weight_estimate} kg</span>
          )}
        </div>
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
        <h3 className="text-sm font-semibold text-gray-800 mb-2 leading-snug">{listing.title}</h3>

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

    

        <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop:`1.5px solid ${catColor.bg}` }}>
          <span className="text-xs text-gray-300">{timeAgo(listing.created_at)}</span>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
  {/* Message button for junkshops */}
  {user && profile?.role === 'junkshop' && !isOwner && (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigate(
          `/dashboard/junkshop?tab=messages` +
          `&contact=${listing.posted_by}` +
          `&listing=${listing.id}` +
          `&title=${encodeURIComponent(listing.title)}` +
          `&image=${encodeURIComponent(listing.photos?.[0] || '')}` +
          `&weight=${listing.weight_estimate || ''}` +
          `&category=${encodeURIComponent(listing.category || '')}`
        )
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

  {/* 3-dot dropdown */}
  {user && (
    <DropdownMenu
      isOwner={isOwner}
      listingId={listing.id}
      onEdit={() => navigate(`/listing/${listing.id}/edit`)}
      onReport={() => handleReport(listing.id)}
    />
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

      {reportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
          onClick={() => setReportId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-sm font-medium text-gray-700">Report submitted</p>
                <p className="text-xs text-gray-400 mt-1">We'll review this listing shortly</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-800">Report listing</h3>
                  <button onClick={() => setReportId(null)}
                    className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Help us keep WAIZ safe. Tell us why you're reporting this listing.
                </p>
                <div className="space-y-2 mb-4">
                  {['Spam or misleading', 'Inappropriate content', 'Already sold/unavailable', 'Wrong category', 'Other'].map(r => (
                    <button key={r}
                      onClick={() => setReportReason(r)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs border transition"
                      style={{
                        borderColor:     reportReason === r ? '#DC2626' : '#E5E7EB',
                        backgroundColor: reportReason === r ? '#FEF2F2' : '#fff',
                        color:           reportReason === r ? '#DC2626' : '#6B7280',
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setReportId(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
                    Cancel
                  </button>
                  <button onClick={submitReport} disabled={reportSending || !reportReason}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: reportReason ? '#DC2626' : '#9CA3AF' }}>
                    {reportSending ? 'Sending...' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

function DropdownMenu({ isOwner, listingId, onEdit, onReport }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p) }}
        className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="5" r="1" fill="currentColor"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="12" cy="19" r="1" fill="currentColor"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 bottom-10 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50"
          style={{ minWidth:'140px' }}
          onClick={e => e.stopPropagation()}>
          {isOwner && (
            <button
              onClick={() => { setOpen(false); onEdit() }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
              ✏️ Edit listing
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onReport() }}
            className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-50 transition flex items-center gap-2"
            style={{ color:'#DC2626' }}>
            🚩 Report listing
          </button>
        </div>
      )}
    </div>
  )
}