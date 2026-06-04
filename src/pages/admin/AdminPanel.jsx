import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase/config'
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { key:'overview',      label:'Overview',       icon:<DashIcon />    },
  { key:'users',         label:'Users',          icon:<UsersIcon />   },
  { key:'listings',      label:'Listings',       icon:<ListIcon />    },
  { key:'junkshops',     label:'Junkshops',      icon:<ShopIcon />    },
  { key:'pickups',       label:'Pickups',        icon:<TruckIcon />   },
  { key:'reports',       label:'Reports',        icon:<FlagIcon />    },
  { key:'ratings',       label:'Ratings',        icon:<StarIcon />    },
  { key:'announcements', label:'Announcements',  icon:<MegaIcon />    },
  { key:'analytics',     label:'Analytics',      icon:<ChartIcon />   },
]

const DUMMY_STATS = {
  total_households:  0,
  total_junkshops:   0,
  total_listings:    0,
  active_listings:   0,
  total_pickups:     0,
  completed_pickups: 0,
  kg_diverted:       0,
}

const MATERIAL_DATA = [
  { label:'Metal',      kg: 0 },
  { label:'Paper',      kg: 0 },
  { label:'Plastic',    kg: 0 },
  { label:'E-waste',    kg: 0 },
  { label:'Glass',      kg: 0 },
  { label:'Secondhand', kg: 0 },
]

const CAT_COLORS = {
  metal:      { bg:'#E1F5EE', color:'#085041' },
  paper:      { bg:'#EAF3DE', color:'#173404' },
  plastic:    { bg:'#E6F1FB', color:'#042C53' },
  ewaste:     { bg:'#FAEEDA', color:'#412402' },
  glass:      { bg:'#EEEDFE', color:'#26215C' },
  secondhand: { bg:'#FBEAF0', color:'#4B1528' },
}

const STATUS_STYLE = {
  available: { bg:'#D8F3DC', color:'#085041' },
  pending:   { bg:'#FAEEDA', color:'#7A3F08' },
  completed: { bg:'#F3F4F6', color:'#6B7280' },
  accepted:  { bg:'#D8F3DC', color:'#085041' },
  cancelled: { bg:'#FAECE7', color:'#993C1D' },
}


function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

export default function AdminPanel() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const [collapsed, setCollapsed] = useState(false)
const [stats,     setStats]     = useState({
  total_households:0, total_junkshops:0, total_listings:0,
  active_listings:0,  total_pickups:0,   completed_pickups:0, kg_diverted:0,
})
const [users,     setUsers]     = useState([])
const [listings,  setListings]  = useState([])
const [junkshops, setJunkshops] = useState([])
const [pickups,   setPickups]   = useState([])
  const [search,    setSearch]    = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userBarangayFilter, setUserBarangayFilter] = useState('all')
  const [junkshopSortBy, setJunkshopSortBy] = useState('rating_high')
  const [loading,   setLoading]   = useState(false)
  const [ratingTab, setRatingTab] = useState('junkshop')
  const [reports,       setReports]       = useState([])
const [announcement,  setAnnouncement]  = useState('')
const [sending,       setSending]       = useState(false)
const [announceSent,  setAnnounceSent]  = useState(false)
const [ratings, setRatings] = useState([])
const [pickupYearFilter, setPickupYearFilter] = useState('all')
const [pickupArchiveFilter, setPickupArchiveFilter] = useState('active')

  useEffect(() => {
  if (!user) return
  fetchData()

  const channel = supabase
    .channel('admin-realtime')
    .on('postgres_changes', { event:'*', schema:'public', table:'listings' }, () => fetchData())
    .on('postgres_changes', { event:'*', schema:'public', table:'pickups' }, () => fetchData())
    .on('postgres_changes', { event:'*', schema:'public', table:'profiles' }, () => fetchData())
    .on('postgres_changes', { event:'*', schema:'public', table:'reports' }, () => fetchData())
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user])

  

  const fetchData = async () => {
    setLoading(true)

    const { data: reportData } = await supabase
  .from('reports')
  .select('*, listings(title, category, barangay), reporter:profiles!reported_by(full_name)')
  .order('created_at', { ascending: false })

if (reportData?.length > 0) setReports(reportData)

  const { data: ratingsData } = await supabase
  .from('ratings')
  .select('*, household:profiles!household_id(full_name), junkshops!junkshop_id(shop_name)')
  .order('created_at', { ascending: false })

const { data: householdRatingsData } = await supabase
  .from('household_ratings')
  .select('*, junkshop:profiles!junkshop_id(full_name), household:profiles!household_id(full_name)')
  .order('created_at', { ascending: false })

const combined = [
  ...(ratingsData || []).map(r => ({ ...r, type: 'junkshop_rated' })),
  ...(householdRatingsData || []).map(r => ({ ...r, type: 'household_rated' })),
].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

if (combined.length > 0) setRatings(combined)

    const { data: usersData } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false })

    const { data: listData } = await supabase
      .from('listings').select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    const { data: shopData } = await supabase
      .from('junkshops').select('*').order('rating', { ascending: false })

    const { data: pickupData } = await supabase
  .from('pickups')
  .select('*, listings(title), profiles!household_id(full_name), junkshops(shop_name)')
  .order('created_at', { ascending: false })

    if (usersData)              setUsers(usersData.length     > 0 ? usersData    : [])
if (listData?.length  > 0)  setListings(listData)
if (shopData?.length  > 0)  setJunkshops(shopData)
if (pickupData?.length > 0) setPickups(pickupData)

    // Compute stats from real data
    if (usersData) {
      setStats({
        total_households:  usersData.filter(u => u.role === 'household').length || DUMMY_STATS.total_households,
        total_junkshops:   usersData.filter(u => u.role === 'junkshop').length  || DUMMY_STATS.total_junkshops,
        total_listings:    listData?.length    || DUMMY_STATS.total_listings,
        active_listings:   listData?.filter(l => l.status === 'available').length || DUMMY_STATS.active_listings,
        total_pickups:     pickupData?.length  || DUMMY_STATS.total_pickups,
        completed_pickups: pickupData?.filter(p => p.status === 'completed').length || DUMMY_STATS.completed_pickups,
        kg_diverted: listData
  ?.filter(l => l.status === 'completed')
  .reduce((s, l) => s + (l.weight_estimate || 0), 0) || 0,
      })
    }
    setLoading(false)
  }

  const exportCSV = ({ listings, pickups, users, junkshops }) => {
  const timestamp = new Date().toLocaleDateString('en-PH')

  const listingRows = [
    ['WAIZ - Baguio City Waste Management Data Export'],
    [`Generated: ${timestamp}`],
    [''],
    ['=== LISTINGS ==='],
    ['Title', 'Category', 'Status', 'Barangay', 'Weight (kg)', 'Date Posted'],
    ...listings.map(l => [
      l.title, l.category, l.status, l.barangay, l.weight_estimate || '', l.created_at?.slice(0,10)
    ]),
    [''],
    ['=== PICKUPS ==='],
    ['Listing', 'Status', 'Offered Price', 'Date'],
    ...pickups.map(p => [
      p.listings?.title || 'Unknown', p.status, p.offered_price || 0, p.created_at?.slice(0,10)
    ]),
    [''],
    ['=== JUNKSHOPS ==='],
    ['Shop Name', 'Barangay', 'Verified', 'Total Pickups', 'Rating'],
    ...junkshops.map(s => [
      s.shop_name, s.barangay, s.is_verified ? 'Yes' : 'No', s.total_pickups || 0, s.rating || 0
    ]),
    [''],
    ['=== SUMMARY ==='],
    ['Total households', users.filter(u => u.role === 'household').length],
    ['Total junkshops',  users.filter(u => u.role === 'junkshop').length],
    ['Total listings',   listings.length],
    ['Completed pickups',pickups.filter(p => p.status === 'completed').length],
    ['Total kg diverted',listings.filter(l=>l.status==='completed').reduce((s,l)=>s+(l.weight_estimate||0),0)],
  ]

  const csv     = listingRows.map(row => row.join(',')).join('\n')
  const blob    = new Blob([csv], { type:'text/csv' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href        = url
  a.download    = `WAIZ_BaguioCity_WasteData_${timestamp.replace(/\//g,'-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

  const handleVerifyJunkshop = async (id, value) => {
  const { error } = await supabase
    .from('junkshops').update({ is_verified: value }).eq('id', id)
  if (!error) setJunkshops(prev =>
    prev.map(s => s.id === id ? { ...s, is_verified: value } : s)
  )
}

const handleFeatureJunkshop = async (id, value) => {
  const { error } = await supabase
    .from('junkshops').update({ is_featured: value }).eq('id', id)
  if (!error) setJunkshops(prev =>
    prev.map(s => s.id === id ? { ...s, is_featured: value } : s)
  )
}

const handleBanUser = async (id, value) => {
  const { error } = await supabase
    .from('profiles').update({ is_banned: value }).eq('id', id)
  if (!error) setUsers(prev =>
    prev.map(u => u.id === id ? { ...u, is_banned: value } : u)
  )
}

const handleRemoveListing = async (id) => {
  const { error } = await supabase
    .from('listings').delete().eq('id', id)
  if (!error) setListings(prev => prev.filter(l => l.id !== id))
}

const handleDismissReport = async (id) => {
  await supabase.from('reports').delete().eq('id', id)
  setReports(prev => prev.filter(r => r.id !== id))
}

const handleRemoveReportedListing = async (report) => {
  await supabase.from('listings').delete().eq('id', report.listing_id)
  await supabase.from('reports').delete().eq('listing_id', report.listing_id)
  setReports(prev => prev.filter(r => r.listing_id !== report.listing_id))
  setListings(prev => prev.filter(l => l.id !== report.listing_id))
}

const handleAnnouncement = async () => {
  if (!announcement.trim()) return
  setSending(true)

  // Insert a message to all users from admin
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', user.id)

  if (allUsers) {
    const messages = allUsers.map(u => ({
      sender_id:   user.id,
      receiver_id: u.id,
      content:     `📢 WAIZ Announcement: ${announcement}`,
      is_read:     false,
    }))
    await supabase.from('messages').insert(messages)
  }

  setSending(false)
  setAnnounceSent(true)
  setAnnouncement('')
  setTimeout(() => setAnnounceSent(false), 3000)
}

const handleDeleteRating = async (id, junkshopId, type) => {
  const table = type === 'household_rated' ? 'household_ratings' : 'ratings'
  await supabase.from(table).delete().eq('id', id)
  setRatings(prev => prev.filter(r => r.id !== id))

  // Recalculate average
  const { data: remaining } = await supabase
    .from('ratings')
    .select('score')
    .eq('junkshop_id', junkshopId)

  const avg = remaining?.length > 0
    ? remaining.reduce((s, r) => s + r.score, 0) / remaining.length
    : 0
  await supabase.from('junkshops')
    .update({ rating: parseFloat(avg.toFixed(1)) })
    .eq('id', junkshopId)
}

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const filteredUsers = users
  .filter(u => {
    const matchSearch   = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.barangay?.toLowerCase().includes(search.toLowerCase())
    const matchRole     = userRoleFilter === 'all' || u.role === userRoleFilter
    const matchBarangay = userBarangayFilter === 'all' || u.barangay === userBarangayFilter
    return matchSearch && matchRole && matchBarangay
  })
  .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  const filteredListings = listings
  .filter(l => l.title?.toLowerCase().includes(search.toLowerCase()))
  .sort((a, b) => (a.title || '').localeCompare(b.title || ''))

  const sortedJunkshops = [...junkshops].sort((a, b) => {
    if (junkshopSortBy === 'rating_high') {
      return (b.rating || 0) - (a.rating || 0)
    } else if (junkshopSortBy === 'rating_low') {
      return (a.rating || 0) - (b.rating || 0)
    }
    return 0
  })

  const filteredJunkshopsForRatings = (() => {
    if (junkshopSortBy === 'all') {
      return sortedJunkshops
    } else if (junkshopSortBy === 'rating_high') {
      const maxRating = Math.max(...junkshops.map(s => s.rating || 0))
      return sortedJunkshops.filter(s => (s.rating || 0) === maxRating)
    } else if (junkshopSortBy === 'rating_low') {
      const minRating = Math.min(...junkshops.map(s => s.rating || 0))
      return sortedJunkshops.filter(s => (s.rating || 0) === minRating)
    }
    return sortedJunkshops
  })()

  const filteredHouseholdRatings = (() => {
    const householdRatings = ratings.filter(r => r.type === 'household_rated')

    // Group ratings by household
    const groupedByHousehold = {}
    householdRatings.forEach(r => {
      const householdId = r.household_id
      if (!groupedByHousehold[householdId]) {
        groupedByHousehold[householdId] = {
          household: r.household,
          ratings: [],
          avgScore: 0,
          totalScore: 0
        }
      }
      groupedByHousehold[householdId].ratings.push(r)
      groupedByHousehold[householdId].totalScore += r.score
    })

    // Calculate averages
    const combined = Object.values(groupedByHousehold).map(item => ({
      ...item,
      avgScore: (item.totalScore / item.ratings.length).toFixed(1)
    }))

    // Apply filters
    if (junkshopSortBy === 'all') {
      return combined.sort((a, b) => b.avgScore - a.avgScore)
    } else if (junkshopSortBy === 'rating_high') {
      const maxScore = Math.max(...combined.map(c => c.avgScore || 0))
      return combined.filter(c => parseFloat(c.avgScore || 0) === maxScore).sort((a, b) => b.avgScore - a.avgScore)
    } else if (junkshopSortBy === 'rating_low') {
      const minScore = Math.min(...combined.map(c => c.avgScore || 0))
      return combined.filter(c => parseFloat(c.avgScore || 0) === minScore).sort((a, b) => a.avgScore - b.avgScore)
    }
    return combined
  })()

  const getYearFromDate = (dateStr) => {
    return dateStr ? new Date(dateStr).getFullYear() : null
  }

  const getAvailableYears = () => {
    const years = new Set()
    years.add(2026)
    pickups.forEach(p => {
      if (p.created_at) years.add(getYearFromDate(p.created_at))
    })
    return Array.from(years).sort().reverse()
  }

  const filteredPickups = pickups.filter(p => {
    if (pickupYearFilter !== 'all') {
      const pickupYear = getYearFromDate(p.created_at)
      if (pickupYear !== parseInt(pickupYearFilter)) return false
    }

    if (pickupArchiveFilter === 'active') return !p.is_archived
    if (pickupArchiveFilter === 'archived') return p.is_archived

    return true
  })

  const handleArchivePickup = async (pickupId, isArchiving) => {
    const { error } = await supabase
      .from('pickups')
      .update({
        is_archived: isArchiving,
        archived_at: isArchiving ? new Date().toISOString() : null
      })
      .eq('id', pickupId)

    if (!error) fetchData()
  }

  const downloadPickupsReport = (format) => {
    const reportData = filteredPickups

    if (format === 'csv') {
      const rows = [
        ['WAIZ - Pickup Transactions Report'],
        [`Generated: ${new Date().toLocaleDateString('en-PH')}`],
        [''],
        ['Transaction ID', 'Household/User Name', 'Junkshop Name', 'Pickup Date', 'Waste Type', 'Weight', 'Amount', 'Status'],
        ...reportData.map(p => [
          p.id,
          p.profiles?.full_name || '—',
          p.junkshops?.shop_name || '—',
          p.created_at?.slice(0, 10) || '—',
          p.material_types?.join(', ') || '—',
          p.est_weight_kg ? `${p.est_weight_kg} kg` : '—',
          p.offered_price ? `₱${p.offered_price}` : '—',
          p.status
        ])
      ]

      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `PickupTransactions_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const totalKg = MATERIAL_DATA.reduce((s, m) => s + m.kg, 0)

  return (
    <div className="flex w-full" style={{ backgroundColor:'#FEFDF8', minHeight: '100vh' }}>

      {/* SIDEBAR */}
      <aside className="flex flex-col shrink-0"
        style={{
          width: collapsed ? '64px' : '220px',
          backgroundColor:'#0D2B1F',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: 30
        }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b"
          style={{ borderColor:'#1A4D35' }}>
          {!collapsed && (
            <Link to="/" className="text-lg font-medium tracking-widest" style={{ color:'#D8F3DC' }}>
              WA<span style={{ color:'#C97A3A' }}>I</span>Z
            </Link>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg"
            style={{ color:'#52B788', marginLeft: collapsed ? 'auto' : 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div className="px-4 py-4 border-b" style={{ borderColor:'#1A4D35' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium mb-2"
              style={{ backgroundColor:'#C97A3A', color:'#fff' }}>AD</div>
            <div className="text-sm font-medium" style={{ color:'#D8F3DC' }}>Admin Panel</div>
            <div className="text-xs mt-0.5" style={{ color:'#52B788' }}>WAIZ Platform</div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <style>{`
            nav::-webkit-scrollbar { display: none; }
          `}</style>
          {NAV.map(item => {
            const isActive = activeTab === item.key
            return (
              <Link key={item.key}
                to={`/admin?tab=${item.key}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition"
                style={{
                  backgroundColor: isActive ? '#C97A3A' : 'transparent',
                  color:           isActive ? '#fff'    : '#74C69D',
                }}>
                <span style={{ color: isActive ? '#fff' : '#52B788' }}>{item.icon}</span>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-2 py-3 border-t" style={{ borderColor:'#1A4D35' }}>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
            style={{ color:'#74C69D' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0"
        style={{
          marginLeft: collapsed ? '64px' : '220px',
          transition: 'margin-left 0.2s ease',
        }}>

        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M11 11l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input className="text-sm outline-none bg-transparent placeholder-gray-300 w-40"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-xs px-3 py-1.5 rounded-xl font-medium"
              style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
              Admin
            </span>
          </div>
        </div>

        <div className="p-8">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Header */}
              <div className="rounded-2xl p-6 mb-6"
                style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
                <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'#52B788' }}>
                  Admin Overview
                </p>
                <h1 className="text-2xl font-medium text-white mb-1">
                  WAIZ Platform Dashboard
                </h1>
                <p className="text-sm" style={{ color:'#74C69D' }}>
                  Baguio City Recycling Marketplace — Platform overview
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label:'Total households',   value: stats.total_households,  bg:'#D8F3DC', color:'#085041', sub:'registered users'    },
                  { label:'Total junkshops',    value: stats.total_junkshops,   bg:'#FAEEDA', color:'#7A3F08', sub:'registered shops'    },
                  { label:'Active listings',    value: stats.active_listings,   bg:'#E6F1FB', color:'#042C53', sub:'available now'       },
                  { label:'Completed pickups',  value: stats.completed_pickups, bg:'#EAF3DE', color:'#173404', sub:'total transactions'  },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: s.bg }}>
                    <div className="text-2xl font-medium mb-0.5" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs font-medium" style={{ color: s.color }}>{s.label}</div>
                    <div className="text-xs mt-1 opacity-70" style={{ color: s.color }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Second row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label:'Total listings posted', value: stats.total_listings,  bg:'#EEEDFE', color:'#26215C' },
                  { label:'Total pickups',          value: stats.total_pickups,   bg:'#FBEAF0', color:'#4B1528' },
                  { label:'Kg diverted from landfill', value:`${stats.kg_diverted.toLocaleString()} kg`, bg:'#D8F3DC', color:'#085041' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-5 bg-white border border-gray-100">
                    <div className="text-xl font-medium mb-0.5" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="grid grid-cols-2 gap-5">
                {/* Recent listings */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-700">Recent listings</p>
                    <Link to="/admin?tab=listings"
                      className="text-xs" style={{ color:'#1A4D35' }}>View all →</Link>
                  </div>
                  <div className="space-y-2">
                    {listings.slice(0,4).map(l => {
                      const cat = CAT_COLORS[l.category] || CAT_COLORS.metal
                      const s   = STATUS_STYLE[l.status]  || STATUS_STYLE.available
                      return (
                        <div key={l.id} className="flex items-center gap-3 py-1.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
                            style={{ backgroundColor: cat.bg, color: cat.color }}>
                            {l.category?.slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-700 truncate">{l.title}</div>
                            <div className="text-xs text-gray-400">{l.barangay || l.profiles?.full_name}</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ backgroundColor: s.bg, color: s.color }}>
                            {l.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recent pickups */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-700">Recent pickups</p>
                    <Link to="/admin?tab=pickups"
                      className="text-xs" style={{ color:'#1A4D35' }}>View all →</Link>
                  </div>
                  <div className="space-y-2">
                    {pickups.slice(0,4).map(p => {
                      const s = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                      return (
                        <div key={p.id} className="flex items-center gap-3 py-1.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
                            style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
                            {(p.junkshop || p.junkshops?.shop_name || 'JS').slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-700 truncate">
                              {p.listing || p.listings?.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {p.household || p.profiles?.full_name}
                            </div>
                          </div>
                          <span className="text-xs font-medium" style={{ color:'#1A4D35' }}>
                            {p.amount}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-gray-800">User Management</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{filteredUsers.length} registered users</p>
                </div>
                <div className="flex gap-2 flex-wrap">
  {['all','household','junkshop'].map(r => (
    <button key={r}
      onClick={() => setUserRoleFilter(r)}
      className="px-4 py-1.5 rounded-full text-xs font-medium transition"
      style={{
        backgroundColor: userRoleFilter === r ? '#1A4D35' : '#F3F4F6',
        color:           userRoleFilter === r ? '#fff'    : '#6B7280',
      }}>
      {r === 'all' ? 'All users' : r === 'household' ? 'Households' : 'Junkshops'}
    </button>
  ))}
  <div className="w-px bg-gray-200 mx-1" />
  <select
    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600 outline-none"
    value={userBarangayFilter}
    onChange={e => setUserBarangayFilter(e.target.value)}>
    <option value="all">All barangays</option>
    {[...new Set(users.map(u => u.barangay).filter(Boolean))].sort().map(b => (
      <option key={b} value={b}>{b}</option>
    ))}
  </select>
</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="grid text-xs font-medium text-gray-400 px-5 py-3 border-b border-gray-50"
  style={{ gridTemplateColumns:'2fr 1fr 2fr 1fr 1fr 1fr' }}>
  <span>Name</span><span>Role</span><span>Barangay</span>
  <span>Verified</span><span>Joined</span><span>Actions</span>
                </div>
                {filteredUsers.map(u => (
                  <div key={u.id}
                    className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition"
                    style={{ gridTemplateColumns:'2fr 1fr 2fr 1fr 1fr 1fr' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
                        style={{
                          backgroundColor: u.role === 'junkshop' ? '#FAEEDA' : '#D8F3DC',
                          color:           u.role === 'junkshop' ? '#7A3F08' : '#085041',
                        }}>
                        {(u.full_name || 'U').slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{u.full_name}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                      style={{
                        backgroundColor: u.role === 'junkshop' ? '#FAEEDA' : '#D8F3DC',
                        color:           u.role === 'junkshop' ? '#7A3F08' : '#085041',
                      }}>
                      {u.role}
                    </span>
                    <span className="text-sm text-gray-500">{u.barangay || '—'}</span>
                    <span className="text-xs font-medium" style={{ color: u.is_banned ? '#DC2626' : u.is_verified ? '#1A4D35' : '#9CA3AF' }}>
  {u.is_banned ? '🚫 Suspended' : u.is_verified ? '✓ Verified' : 'Unverified'}
</span>
                    <span className="text-xs text-gray-400">{timeAgo(u.created_at)}</span>
                    <button onClick={() => handleBanUser(u.id, !u.is_banned)}
  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 transition"
  style={{
    color: u.is_banned ? '#1A4D35' : '#DC2626',
    borderColor: u.is_banned ? '#B7E4C7' : '#FCA5A5',
  }}>
  {u.is_banned ? 'Unsuspend' : 'Suspend'}
</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTINGS */}
          {activeTab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-gray-800">Listings Moderation</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{filteredListings.length} total listings</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="grid text-xs font-medium text-gray-400 px-5 py-3 border-b border-gray-50"
                  style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr' }}>
                  <span>Title</span><span>Category</span><span>Posted by</span>
                  <span>Barangay</span><span>Status</span><span>Actions</span>
                </div>
                {filteredListings.map(l => {
                  const cat = CAT_COLORS[l.category] || CAT_COLORS.metal
                  const s   = STATUS_STYLE[l.status]  || STATUS_STYLE.available
                  return (
                    <div key={l.id}
                      className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition"
                      style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto' }}>
                      <span className="text-sm font-medium text-gray-700 truncate pr-3">{l.title}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                        style={{ backgroundColor: cat.bg, color: cat.color }}>
                        {l.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {l.profiles?.full_name || l.posted_by || '—'}
                      </span>
                      <span className="text-sm text-gray-500">{l.barangay || '—'}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                        style={{ backgroundColor: s.bg, color: s.color }}>
                        {l.status}
                      </span>
                      <button onClick={() => handleRemoveListing(l.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition">
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* JUNKSHOPS */}
          {activeTab === 'junkshops' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-medium text-gray-800">Junkshop Management</h2>
                <p className="text-sm text-gray-400 mt-0.5">Verify shops and manage featured placements</p>
              </div>
              <div className="space-y-3">
                {junkshops.map(shop => (
                  <div key={shop.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-medium shrink-0"
                      style={{ backgroundColor:'#D8F3DC', color:'#0D2B1F' }}>
                      {(shop.shop_name || 'JS').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">{shop.shop_name}</span>
                        {shop.is_verified && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>✓ Verified</span>
                        )}
                        {shop.is_featured && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>Featured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
  <span>{shop.barangay}</span>
  <span>·</span>
  <span>★ {shop.rating || 'No ratings'}</span>
  <span>·</span>
  <span>{shop.total_pickups || 0} pickups</span>
  {shop.dti_number && (
    <>
      <span>·</span>
      <span className="font-medium" style={{ color:'#1A4D35' }}>
        DTI: {shop.dti_number}
      </span>
    </>
  )}
</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleVerifyJunkshop(shop.id, !shop.is_verified)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition font-medium"
                        style={{
                          borderColor:     shop.is_verified ? '#FCA5A5' : '#B7E4C7',
                          color:           shop.is_verified ? '#DC2626' : '#1A4D35',
                          backgroundColor: shop.is_verified ? '#FEF2F2' : '#F0FDF4',
                        }}>
                        {shop.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleFeatureJunkshop(shop.id, !shop.is_featured)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition font-medium"
                        style={{
                          borderColor:     shop.is_featured ? '#FCA5A5' : '#FAEEDA',
                          color:           shop.is_featured ? '#DC2626' : '#7A3F08',
                          backgroundColor: shop.is_featured ? '#FEF2F2' : '#FFFBEB',
                        }}>
                        {shop.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PICKUPS */}
          {activeTab === 'pickups' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-medium text-gray-800">Pickup Transactions</h2>
                <p className="text-sm text-gray-400 mt-0.5">{filteredPickups.length} of {pickups.length} records</p>
              </div>

              {/* Filter Toolbar */}
              <div className="mb-4 flex items-center gap-3 flex-wrap">
                {/* Year Filter */}
                <select
                  value={pickupYearFilter}
                  onChange={(e) => setPickupYearFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-xs font-medium"
                  style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                  <option value="all">All Years</option>
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                {/* Archive Status Tabs */}
                <div className="flex gap-2 border border-gray-200 rounded-lg p-1" style={{ backgroundColor: '#F9FAFB' }}>
                  {['active', 'archived', 'all'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setPickupArchiveFilter(filter)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition"
                      style={{
                        backgroundColor: pickupArchiveFilter === filter ? '#D8F3DC' : 'transparent',
                        color: pickupArchiveFilter === filter ? '#1A4D35' : '#6B7280'
                      }}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Download Buttons */}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => downloadPickupsReport('csv')}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 transition hover:shadow-lg"
                    style={{ backgroundColor: '#C97A3A', boxShadow: '0 2px 8px rgba(201, 122, 58, 0.2)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    CSV
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="grid text-xs font-medium text-gray-400 px-5 py-3 border-b border-gray-50"
                  style={{ gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 0.8fr' }}>
                  <span>Listing / Materials</span><span>Household</span>
                  <span>Weight</span><span>Amount</span><span>Status</span><span>Action</span>
                </div>
                {filteredPickups.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400">
                    <p className="text-sm">No transactions found</p>
                  </div>
                ) : (
                  filteredPickups.map(p => {
                    const s = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                    return (
                      <div key={p.id}
                        className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        style={{ gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 0.8fr' }}>
                        <div className="min-w-0 pr-3">
                          <div className="text-sm font-medium text-gray-700 truncate">
                            {p.listings?.title || 'Direct request'}
                          </div>
                          {p.material_types?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.material_types.slice(0,3).map(m => (
                                <span key={m} className="text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                          {p.note && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate">📝 {p.note}</div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {p.profiles?.full_name || '—'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {p.est_weight_kg ? `~${p.est_weight_kg} kg` : '—'}
                        </span>
                        <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>
                          {p.offered_price ? `₱${p.offered_price}` : '—'}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                          style={{ backgroundColor: s.bg, color: s.color }}>
                          {p.status}
                        </span>
                        <button
                          onClick={() => handleArchivePickup(p.id, !p.is_archived)}
                          className="px-2 py-1 rounded text-xs font-medium transition"
                          style={{
                            backgroundColor: p.is_archived ? '#FEE2E2' : '#EFF6FF',
                            color: p.is_archived ? '#991B1B' : '#1E40AF'
                          }}>
                          {p.is_archived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
        <p className="text-xs font-normal text-gray-500 mt-0.5">
          Real-time waste management data — Baguio City
        </p>
      </div>
      <button
        onClick={() => exportCSV({ listings, pickups, users, junkshops })}
        className="px-4 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 transition hover:shadow-lg"
        style={{ backgroundColor:'#C97A3A', boxShadow: '0 2px 8px rgba(201, 122, 58, 0.2)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
      </button>
    </div>

    {/* RA 9003 Compliance Banner */}
    <div className="rounded-2xl p-4 mb-6 relative overflow-hidden"
      style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)', boxShadow: '0 2px 8px rgba(13, 43, 31, 0.15)' }}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12" />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-0.5" style={{ color:'#52B788' }}>
            ✓ RA 9003 Compliance
          </p>
          <h3 className="text-base font-semibold text-white mb-0.5">
            Baguio City Waste Diversion Report
          </h3>
          <p className="text-xs font-normal" style={{ color:'#B7E4C7' }}>
            Live data for CENRO, SWMO, and DENR reporting
          </p>
        </div>
        <div className="text-right ml-6">
          <div className="text-2xl font-semibold text-white">
            {stats.kg_diverted.toLocaleString()}
          </div>
          <div className="text-xs mt-1 font-normal" style={{ color:'#B7E4C7' }}>
            kg diverted from SLF
          </div>
        </div>
      </div>
    </div>

    {/* Key metrics row */}
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        {
          label: 'Household participation',
          value: stats.total_households > 0
            ? `${Math.round((stats.total_households / 100) * 100)}%`
            : '0%',
          sub:   `${stats.total_households} of est. 100 target households`,
          bg:    '#D8F3DC', color:'#085041', icon: '👥', gradient: 'linear-gradient(135deg, #D8F3DC 0%, #B7E4C7 100%)',
        },
        {
          label: 'Pickup completion rate',
          value: stats.total_pickups > 0
            ? `${Math.round((stats.completed_pickups / stats.total_pickups) * 100)}%`
            : '0%',
          sub:   `${stats.completed_pickups} of ${stats.total_pickups} pickups done`,
          bg:    '#E6F1FB', color:'#042C53', icon: '✓', gradient: 'linear-gradient(135deg, #E6F1FB 0%, #B5D4F4 100%)',
        },
        {
          label: 'Active junkshop network',
          value: stats.total_junkshops,
          sub:   'registered collectors in Baguio',
          bg:    '#FAEEDA', color:'#7A3F08', icon: '🏪', gradient: 'linear-gradient(135deg, #FAEEDA 0%, #FAC775 100%)',
        },
        {
          label: 'CO₂ equivalent saved',
          value: `${(stats.kg_diverted * 0.5).toFixed(0)} kg`,
          sub:   'based on IPCC recycling factors',
          bg:    '#EAF3DE', color:'#173404', icon: '🌿', gradient: 'linear-gradient(135deg, #EAF3DE 0%, #C0DD97 100%)',
        },
      ].map(s => (
        <div key={s.label} className="group rounded-xl p-3.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer relative overflow-hidden" style={{
          background: s.gradient,
          border: `1.5px solid ${s.color}20`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-6 -mt-6" style={{ backgroundColor: s.color }} />

          <div className="relative z-10">
            {/* Icon container */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-2 transition-all duration-300 group-hover:scale-110" style={{
              backgroundColor: `${s.color}15`,
              border: `1px solid ${s.color}30`
            }}>
              {s.icon}
            </div>

            {/* Value */}
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>
              {s.value}
            </div>

            {/* Label */}
            <div className="text-xs font-semibold mb-1" style={{ color: s.color }}>
              {s.label}
            </div>

            {/* Sub text */}
            <div className="text-xs font-normal" style={{ color: s.color, opacity: 0.75 }}>
              {s.sub}
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r" style={{
            backgroundImage: `linear-gradient(to right, ${s.color}30, ${s.color}10, transparent)`
          }} />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-4 mb-6">

      {/* Material breakdown - Vertical Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="mb-5">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">
            Waste Characterization by Material
          </h3>
          <p className="text-xs text-gray-500">
            Required for RA 9003 Sec. 17 annual report
          </p>
        </div>
        {(() => {
          const breakdown = [
            { key:'metal',      label:'Metal',      color:'#085041', bg:'#D8F3DC' },
            { key:'paper',      label:'Paper',      color:'#173404', bg:'#EAF3DE' },
            { key:'plastic',    label:'Plastic',    color:'#042C53', bg:'#E6F1FB' },
            { key:'ewaste',     label:'E-waste',    color:'#412402', bg:'#FAEEDA' },
            { key:'glass',      label:'Glass',      color:'#26215C', bg:'#EEEDFE' },
            { key:'secondhand', label:'Secondhand', color:'#4B1528', bg:'#FBEAF0' },
          ]
          const data = breakdown.map(b => ({
            ...b,
            kg: listings
              .filter(l => l.category === b.key && l.status === 'completed')
              .reduce((s, l) => s + (l.weight_estimate || 0), 0)
          }))
          const maxKg = Math.max(...data.map(d => d.kg), 1)
          const chartHeight = 180
          const barWidth = 45
          const chartWidth = data.length * 60 + 20

          return (
            <div className="overflow-x-auto -mx-1 px-1">
              <svg width={chartWidth} height={chartHeight + 60} style={{ minWidth: '100%' }}>
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
                  const kgValue = Math.round(maxKg * percent)
                  const y = chartHeight - (chartHeight * percent)
                  return (
                    <g key={`y-${i}`}>
                      <text x="18" y={y + 65} fontSize="11" fill="#9CA3AF" textAnchor="end" dominantBaseline="middle">
                        {kgValue}
                      </text>
                      {i > 0 && (
                        <line x1="28" y1={y + 60} x2={chartWidth - 10} y2={y + 60} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                      )}
                    </g>
                  )
                })}

                {/* Bars and labels */}
                {data.map((d, i) => {
                  const barHeight = (d.kg / maxKg) * chartHeight
                  const x = 60 + i * 60
                  const y = chartHeight + 60 - barHeight

                  return (
                    <g key={d.key}>
                      {/* Bar */}
                      <rect
                        x={x - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={d.color}
                        rx="4"
                        opacity="0.9"
                        style={{ transition: 'opacity 0.2s' }}
                      />

                      {/* Bar value label */}
                      <text
                        x={x}
                        y={y - 8}
                        fontSize="12"
                        fontWeight="600"
                        fill={d.color}
                        textAnchor="middle"
                      >
                        {d.kg > 0 ? `${Math.round(d.kg)}kg` : '—'}
                      </text>

                      {/* X-axis label */}
                      <text
                        x={x}
                        y={chartHeight + 75}
                        fontSize="12"
                        fontWeight="500"
                        fill="#374151"
                        textAnchor="middle"
                      >
                        {d.label}
                      </text>
                    </g>
                  )
                })}

                {/* Axes */}
                <line x1="28" y1="60" x2="28" y2={chartHeight + 60} stroke="#D1D5DB" strokeWidth="2" />
                <line x1="28" y1={chartHeight + 60} x2={chartWidth - 10} y2={chartHeight + 60} stroke="#D1D5DB" strokeWidth="2" />
              </svg>
            </div>
          )
        })()}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {listings.length > 0 && (
              <>
                <div>
                  <span className="text-gray-500">Total listings: </span>
                  <span className="font-semibold" style={{ color:'#1A4D35' }}>{listings.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Completed: </span>
                  <span className="font-semibold" style={{ color:'#1A4D35' }}>{listings.filter(l => l.status === 'completed').length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total kg diverted: </span>
                  <span className="font-semibold" style={{ color:'#1A4D35' }}>{stats.kg_diverted}kg</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barangay activity */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">
            Barangay Activity Map
          </h3>
          <p className="text-xs text-gray-500">
            Geographic waste generation data for city planning
          </p>
        </div>
        {(() => {
          const barangayCounts = {}
          listings.forEach(l => {
            if (l.barangay) {
              barangayCounts[l.barangay] = (barangayCounts[l.barangay] || 0) + 1
            }
          })
          const sorted = Object.entries(barangayCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
          const max = sorted[0]?.[1] || 1

          if (sorted.length === 0) return (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">No barangay data yet</p>
            </div>
          )

          return sorted.map(([barangay, count], i) => (
            <div key={barangay} className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor:'#1A4D35', color:'#fff' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate">{barangay}</span>
                  <span className="font-bold ml-2 text-xs" style={{ color:'#1A4D35' }}>{count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width:`${(count/max)*100}%`,
                      backgroundColor:'#1A4D35',
                      boxShadow: '0 0 4px rgba(26, 77, 53, 0.6)'
                    }} />
                </div>
              </div>
            </div>
          ))
        })()}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-6">

      {/* Junkshop network */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">
            Informal Collector Network
          </h3>
          <p className="text-xs text-gray-500">
            Economic mapping of Baguio's recycling economy
          </p>
        </div>
        <div className="space-y-2">
          {[
            { label:'Registered collectors',     value: stats.total_junkshops,         icon: '🏪' },
            { label:'Verified collectors',        value: junkshops.filter(s => s.is_verified).length, icon: '✓' },
            { label:'Total pickups completed',    value: stats.completed_pickups,       icon: '📦' },
            { label:'Active listings available',  value: stats.active_listings,         icon: '📋' },
            { label:'Est. economic value',
              value: `₱${(pickups.filter(p=>p.status==='completed').reduce((s,p)=>s+(p.offered_price||0),0)).toLocaleString()}`,
              icon: '💰'
            },
          ].map(row => (
            <div key={row.label}
              className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
              style={{ borderColor: 'rgba(13, 43, 31, 0.3)' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-xs text-gray-600">{row.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color:'#1A4D35' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental impact */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">
            Environmental Impact Report
          </h3>
          <p className="text-xs text-gray-500">
            Suitable for DENR and international sustainability reporting
          </p>
        </div>
        <div className="space-y-2">
          {[
            { label:'Total kg diverted from SLF', value:`${stats.kg_diverted.toLocaleString()} kg`,      icon:'♻️', color: '#085041' },
            { label:'CO₂ emissions avoided',       value:`${(stats.kg_diverted*0.5).toFixed(1)} kg CO₂`, icon:'🌿', color: '#173404' },
            { label:'Tree planting equivalent',    value:`${Math.floor(stats.kg_diverted/15)} trees`,     icon:'🌳', color: '#2D6B3F' },
            { label:'Water conserved',             value:`${(stats.kg_diverted*2).toLocaleString()} L`,   icon:'💧', color: '#042C53' },
            { label:'E-waste properly handled',
              value:`${listings.filter(l=>l.category==='ewaste').reduce((s,l)=>s+(l.weight_estimate||0),0)} kg`,
              icon:'⚡', color: '#412402'
            },
          ].map(row => (
            <div key={row.label}
              className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
              style={{ borderColor: `${row.color}15` }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-xs text-gray-600">{row.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Monthly trend */}
    <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="mb-5">
        <h3 className="text-sm font-bold text-gray-900 mb-0.5">Monthly Pickup Trend</h3>
        <p className="text-xs text-gray-500">
          Pickup volume over time — shows program growth for LGU reporting
        </p>
      </div>
      {(() => {
        const months = {}
        pickups.forEach(p => {
          const month = new Date(p.created_at).toLocaleDateString('en-PH', { month:'short', year:'2-digit' })
          months[month] = (months[month] || 0) + 1
        })
        const entries = Object.entries(months).slice(-6)
        const max = Math.max(...entries.map(e => e[1]), 1)
        const chartHeight = 160
        const pointRadius = 5
        const chartWidth = entries.length * 55 + 40

        if (entries.length === 0) return (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No trend data yet — appears after first pickups</p>
          </div>
        )

        // Calculate points for the line
        const points = entries.map(([month, count], i) => {
          const x = 65 + i * 55
          const y = chartHeight + 60 - ((count / max) * chartHeight)
          return { x, y, count, month }
        })

        // Create path string for the line
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

        // Create path string for the fill area
        const fillPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight + 60} L ${points[0].x} ${chartHeight + 60} Z`

        return (
          <div className="overflow-x-auto -mx-2 px-2">
            <svg width={chartWidth} height={chartHeight + 70} style={{ minWidth: '100%' }}>
              {/* Y-axis labels and gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
                const pickupValue = Math.round(max * percent)
                const y = chartHeight - (chartHeight * percent)
                return (
                  <g key={`y-${i}`}>
                    <text x="18" y={y + 65} fontSize="11" fill="#9CA3AF" textAnchor="end" dominantBaseline="middle">
                      {pickupValue}
                    </text>
                    {i > 0 && (
                      <line x1="28" y1={y + 60} x2={chartWidth - 15} y2={y + 60} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                    )}
                  </g>
                )
              })}

              {/* Fill area under line */}
              <path
                d={fillPath}
                fill="#1A4D35"
                opacity="0.08"
              />

              {/* Line */}
              <path
                d={linePath}
                stroke="#1A4D35"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points and labels */}
              {points.map((p, i) => (
                <g key={`point-${i}`}>
                  {/* Larger circle for hover area */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={pointRadius + 2}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Value label above point */}
                  <text
                    x={p.x}
                    y={p.y - 15}
                    fontSize="13"
                    fontWeight="700"
                    fill="#1A4D35"
                    textAnchor="middle"
                  >
                    {p.count}
                  </text>

                  {/* Data point circle */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={pointRadius}
                    fill="#1A4D35"
                    stroke="#fff"
                    strokeWidth="2.5"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(26, 77, 53, 0.2))'
                    }}
                  />

                  {/* Month label below */}
                  <text
                    x={p.x}
                    y={chartHeight + 78}
                    fontSize="12"
                    fontWeight="600"
                    fill="#4B5563"
                    textAnchor="middle"
                  >
                    {p.month}
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line x1="28" y1="60" x2="28" y2={chartHeight + 60} stroke="#D1D5DB" strokeWidth="2" />
              <line x1="28" y1={chartHeight + 60} x2={chartWidth - 15} y2={chartHeight + 60} stroke="#D1D5DB" strokeWidth="2" />
            </svg>
          </div>
        )
      })()}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Total pickups: </span>
            <span className="font-semibold" style={{ color:'#1A4D35' }}>{pickups.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Avg per month: </span>
            <span className="font-semibold" style={{ color:'#1A4D35' }}>
              {(() => {
                const months = {}
                pickups.forEach(p => {
                  const month = new Date(p.created_at).toLocaleDateString('en-PH', { month:'short', year:'2-digit' })
                  months[month] = (months[month] || 0) + 1
                })
                const entries = Object.entries(months)
                return entries.length > 0 ? Math.round(pickups.length / entries.length) : 0
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* LGU Data Package info */}
    <div className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FAEEDA 0%, #FFF9E6 100%)',
        boxShadow: '0 2px 8px rgba(201, 122, 58, 0.3)',
        border: '1px solid rgba(201, 122, 58, 0.4)'
      }}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-8 rounded-full -mr-8 -mt-8" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="text-2xl shrink-0">📊</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-1.5" style={{ color:'#7A3F08' }}>
            WAIZ Data Package
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color:'#854F0B' }}>
            Download a comprehensive CSV dataset to track waste diversion metrics, generate reports, and inform policy decisions.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportCSV({ listings, pickups, users, junkshops })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:shadow-md flex items-center gap-1"
              style={{ backgroundColor:'#C97A3A', boxShadow: '0 2px 6px rgba(201, 122, 58, 0.4)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition hover:bg-white"
              style={{ borderColor:'#C97A3A', color:'#C97A3A' }}>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
  
)}

        {/* REPORTS */}
        {activeTab === 'reports' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-medium text-gray-800">Reports queue</h2>
        <p className="text-sm text-gray-400 mt-0.5">{reports.length} pending reports</p>
      </div>
      <span className="text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ backgroundColor:'#FAECE7', color:'#993C1D' }}>
        {reports.length} flagged
      </span>
    </div>
    {reports.length === 0 ? (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
        <div className="text-4xl mb-3">🚩</div>
        <p className="text-sm font-medium text-gray-500">No reports</p>
        <p className="text-xs text-gray-400 mt-1">All clear — no listings have been reported</p>
      </div>
    ) : (
      <div className="space-y-3">
        {reports.map(r => {
          const cat = CAT_COLORS[r.listings?.category] || CAT_COLORS.metal
          return (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-200 transition">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
                style={{ backgroundColor: cat.bg, color: cat.color }}>
                {r.listings?.category?.slice(0,2).toUpperCase() || '??'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {r.listings?.title || 'Deleted listing'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor:'#FAECE7', color:'#993C1D' }}>
                    {r.reason}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Reported by {r.reporter?.full_name || 'Unknown'} · {r.listings?.barangay || '—'}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleDismissReport(r.id)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
                  Dismiss
                </button>
                <button
                  onClick={() => handleRemoveReportedListing(r)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor:'#DC2626' }}>
                  Remove listing
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}

{/* RATINGS */}
{activeTab === 'ratings' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-medium text-gray-800">Ratings management</h2>
        <p className="text-sm text-gray-400 mt-0.5">{ratings.length} total ratings</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-2 border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setRatingTab('junkshop')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              backgroundColor: ratingTab === 'junkshop' ? '#1A4D35' : 'transparent',
              color: ratingTab === 'junkshop' ? '#fff' : '#6B7280',
            }}>
            Junkshop ratings
          </button>
          <button
            onClick={() => setRatingTab('household')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              backgroundColor: ratingTab === 'household' ? '#1A4D35' : 'transparent',
              color: ratingTab === 'household' ? '#fff' : '#6B7280',
            }}>
            Household ratings
          </button>
        </div>

        <select
          value={junkshopSortBy}
          onChange={e => setJunkshopSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600 outline-none">
          <option value="all">All ratings</option>
          <option value="rating_high">Highest rating</option>
          <option value="rating_low">Lowest rating</option>
        </select>
        <span className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
          ★ {ratings.length > 0 ? (ratings.reduce((s,r) => s + r.score, 0) / ratings.length).toFixed(1) : '—'} avg
        </span>
      </div>
    </div>
    {ratings.length === 0 ? (
      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
        <div className="text-4xl mb-3">⭐</div>
        <p className="text-sm font-medium text-gray-500">No ratings yet</p>
        <p className="text-xs text-gray-400 mt-1">Ratings will appear here after households rate pickups</p>
      </div>
    ) : (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {ratingTab === 'junkshop' ? (
          <>
            <div className="grid px-5 py-3 border-b border-gray-100"
              style={{ gridTemplateColumns:'2fr 2fr 1fr 1fr auto' }}>
              {['Shop Name','Featured Status','Average Rating','Pickups',''].map(h => (
                <span key={h} className="text-xs font-medium uppercase tracking-wide"
                  style={{ color:'#9CA3AF', letterSpacing:'0.05em' }}>{h}</span>
              ))}
            </div>
            {filteredJunkshopsForRatings.map((shop, idx) => (
              <div key={`${shop.id}-${idx}`}
                className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                style={{ gridTemplateColumns:'2fr 2fr 1fr 1fr auto' }}>
                <span className="text-sm font-medium text-gray-700">
                  {shop.shop_name || '—'}
                </span>
                <span className="text-sm text-gray-500">
                  {shop.is_featured ? '⭐ Featured' : 'Regular'}
                </span>
                <span style={{ color:'#C97A3A', fontSize:'14px' }}>
                  {'★'.repeat(Math.round(shop.rating || 0))}{'☆'.repeat(5 - Math.round(shop.rating || 0))}
                  <span className="text-xs text-gray-400 ml-1">{shop.rating || '0'}/5</span>
                </span>
                <span className="text-xs text-gray-500">
                  {shop.total_pickups || 0}
                </span>
                <span></span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="grid px-5 py-3 border-b border-gray-100"
              style={{ gridTemplateColumns:'2fr 2fr 1fr 1fr auto' }}>
              {['Household Name','Junkshops','Average Rating','Total Ratings',''].map(h => (
                <span key={h} className="text-xs font-medium uppercase tracking-wide"
                  style={{ color:'#9CA3AF', letterSpacing:'0.05em' }}>{h}</span>
              ))}
            </div>
            {filteredHouseholdRatings.map((item, idx) => (
              <div key={`${item.household?.id}-${idx}`}
                className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                style={{ gridTemplateColumns:'2fr 2fr 1fr 1fr auto' }}>
                <span className="text-sm font-medium text-gray-700">
                  {item.household?.full_name || '—'}
                </span>
                <span className="text-sm text-gray-500">
                  {item.ratings.length} junkshop{item.ratings.length !== 1 ? 's' : ''}
                </span>
                <span style={{ color:'#C97A3A', fontSize:'14px' }}>
                  {'★'.repeat(Math.round(item.avgScore))}{'☆'.repeat(5 - Math.round(item.avgScore))}
                  <span className="text-xs text-gray-400 ml-1">{item.avgScore}/5</span>
                </span>
                <span className="text-xs text-gray-500">
                  {item.ratings.length}
                </span>
                <span></span>
              </div>
            ))}
          </>
        )}
      </div>
    )}
  </div>
)}

{/* ANNOUNCEMENTS */}
{activeTab === 'announcements' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-medium text-gray-800">Announcements</h2>
        <p className="text-sm text-gray-400 mt-0.5">Send a message to all WAIZ users via their inbox</p>
      </div>
      <span className="text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
        {users.length} recipients
      </span>
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <label className="block text-xs font-medium mb-2" style={{ color:'#6B7280' }}>
        Message
      </label>
      <textarea
        className="w-full px-3 py-2.5 text-sm border rounded-xl outline-none resize-none transition"
        style={{ borderColor:'#E5E7EB', backgroundColor:'#FAFAFA' }}
        onFocus={e => { e.target.style.borderColor='#1A4D35'; e.target.style.backgroundColor='#fff' }}
        onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.backgroundColor='#FAFAFA' }}
        rows={5}
        placeholder="Type your announcement here... e.g. WAIZ will be down for maintenance on May 20 from 12am–2am."
        value={announcement}
        onChange={e => setAnnouncement(e.target.value)}
      />
      <div className="flex items-center justify-between mt-2 mb-4">
        <p className="text-xs text-gray-400">
          Sends to all {users.length} registered users as an inbox message.
        </p>
        <span className="text-xs text-gray-400">{announcement.length} chars</span>
      </div>
      {announceSent && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
          style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Announcement sent to all users!
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">📢 Will appear as a WAIZ inbox message</p>
        <button
          onClick={handleAnnouncement}
          disabled={sending || !announcement.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition"
          style={{ backgroundColor: announcement.trim() ? '#1A4D35' : '#D1D5DB', cursor: announcement.trim() ? 'pointer' : 'default' }}>
          {sending ? 'Sending...' : 'Send to all users'}
        </button>
      </div>
    </div>
  </div>
)}
</div>
      </main>
    </div>
    
  )
}

// Icons
function DashIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function ListIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg> }
function ShopIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function TruckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> }
function ChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function FlagIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> }
function MegaIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> }
function StarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }