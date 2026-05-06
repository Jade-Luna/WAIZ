import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase/config'
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { key:'overview',     label:'Overview',       icon:<DashIcon />   },
  { key:'users',        label:'Users',          icon:<UsersIcon />  },
  { key:'listings',     label:'Listings',       icon:<ListIcon />   },
  { key:'junkshops',    label:'Junkshops',      icon:<ShopIcon />   },
  { key:'pickups',      label:'Pickups',        icon:<TruckIcon />  },
  { key:'analytics',    label:'Analytics',      icon:<ChartIcon />  },
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
  const [loading,   setLoading]   = useState(false)

  useEffect(() => { if (user) fetchData() }, [user])

  const fetchData = async () => {
    setLoading(true)


    const { data: usersData } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false })

    const { data: listData } = await supabase
      .from('listings').select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    const { data: shopData } = await supabase
      .from('junkshops').select('*').order('rating', { ascending: false })

    const { data: pickupData } = await supabase
  .from('pickups')
  .select('*, listings(title), profiles!household_id(full_name)')
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

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const filteredUsers = users
  .filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.barangay?.toLowerCase().includes(search.toLowerCase())
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchSearch && matchRole
  })
  .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  const filteredListings = listings
  .filter(l => l.title?.toLowerCase().includes(search.toLowerCase()))
  .sort((a, b) => (a.title || '').localeCompare(b.title || ''))

  const totalKg = MATERIAL_DATA.reduce((s, m) => s + m.kg, 0)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor:'#FEFDF8' }}>

      {/* SIDEBAR */}
      <aside className="flex flex-col sticky top-0 h-screen shrink-0"
        style={{ width: collapsed ? '64px' : '220px', backgroundColor:'#0D2B1F' }}>

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
        <nav className="flex-1 px-2 py-3 space-y-0.5">
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
      <main className="flex-1 min-w-0">

        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="text-sm font-medium text-gray-500">
            {NAV.find(n => n.key === activeTab)?.label || 'Admin'}
          </div>
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
                <div className="flex gap-2">
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
  </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="grid text-xs font-medium text-gray-400 px-5 py-3 border-b border-gray-50"
                  style={{ gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1fr auto' }}>
                  <span>Name</span><span>Role</span><span>Barangay</span>
                  <span>Verified</span><span>Joined</span><span>Actions</span>
                </div>
                {filteredUsers.map(u => (
                  <div key={u.id}
                    className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition"
                    style={{ gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1fr auto' }}>
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
                  style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto' }}>
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
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{shop.barangay}</span>
                        <span>·</span>
                        <span>★ {shop.rating}</span>
                        <span>·</span>
                        <span>{shop.total_pickups} pickups</span>
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
                <p className="text-sm text-gray-400 mt-0.5">{pickups.length} total pickup records</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="grid text-xs font-medium text-gray-400 px-5 py-3 border-b border-gray-50"
                  style={{ gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr 1fr' }}>
                  <span>Listing</span><span>Household</span><span>Junkshop</span>
                  <span>Amount</span><span>Status</span>
                </div>
                {pickups.map(p => {
                  const s = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                  return (
                    <div key={p.id}
                      className="grid items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                      style={{ gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr 1fr' }}>
                      <span className="text-sm font-medium text-gray-700 truncate pr-3">
                        {p.listings?.title || p.listing}
                      </span>
                      <span className="text-sm text-gray-500">
                        {p.profiles?.full_name || p.household}
                      </span>
                      <span className="text-sm text-gray-500">
                        {p.junkshops?.shop_name || p.junkshop}
                      </span>
                      <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>
                        {p.amount || `₱${p.offered_price || 0}`}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                        style={{ backgroundColor: s.bg, color: s.color }}>
                        {p.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-medium text-gray-800">Platform Analytics</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Real-time waste management data — Baguio City
        </p>
      </div>
      <button
        onClick={() => exportCSV({ listings, pickups, users, junkshops })}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2"
        style={{ backgroundColor:'#C97A3A' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export for LGU Report
      </button>
    </div>

    {/* RA 9003 Compliance Banner */}
    <div className="rounded-2xl p-5 mb-6"
      style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'#52B788' }}>
            RA 9003 Compliance Data
          </p>
          <h3 className="text-lg font-medium text-white mb-1">
            Baguio City Waste Diversion Report
          </h3>
          <p className="text-sm" style={{ color:'#74C69D' }}>
            Live data for CENRO, SWMO, and DENR reporting
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-medium text-white">
            {stats.kg_diverted.toLocaleString()} kg
          </div>
          <div className="text-xs mt-1" style={{ color:'#74C69D' }}>
            total materials diverted from SLF
          </div>
        </div>
      </div>
    </div>

    {/* Key metrics row */}
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[
        {
          label: 'Household participation',
          value: stats.total_households > 0
            ? `${Math.round((stats.total_households / 100) * 100)}%`
            : '0%',
          sub:   `${stats.total_households} of est. 100 target households`,
          bg:    '#D8F3DC', color:'#085041',
        },
        {
          label: 'Pickup completion rate',
          value: stats.total_pickups > 0
            ? `${Math.round((stats.completed_pickups / stats.total_pickups) * 100)}%`
            : '0%',
          sub:   `${stats.completed_pickups} of ${stats.total_pickups} pickups done`,
          bg:    '#E6F1FB', color:'#042C53',
        },
        {
          label: 'Active junkshop network',
          value: stats.total_junkshops,
          sub:   'registered collectors in Baguio',
          bg:    '#FAEEDA', color:'#7A3F08',
        },
        {
          label: 'CO₂ equivalent saved',
          value: `${(stats.kg_diverted * 0.5).toFixed(0)} kg`,
          sub:   'based on IPCC recycling factors',
          bg:    '#EAF3DE', color:'#173404',
        },
      ].map(s => (
        <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: s.bg }}>
          <div className="text-2xl font-medium mb-0.5" style={{ color: s.color }}>{s.value}</div>
          <div className="text-xs font-medium mb-1" style={{ color: s.color }}>{s.label}</div>
          <div className="text-xs opacity-70" style={{ color: s.color }}>{s.sub}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-5 mb-5">

      {/* Material breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Waste Characterization by Material
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Required for RA 9003 Sec. 17 annual report
        </p>
        {(() => {
          const breakdown = [
            { key:'metal',      label:'Metal / Scrap',    color:'#085041', bg:'#D8F3DC' },
            { key:'paper',      label:'Paper / Cardboard',color:'#173404', bg:'#EAF3DE' },
            { key:'plastic',    label:'Plastic',          color:'#042C53', bg:'#E6F1FB' },
            { key:'ewaste',     label:'E-waste',          color:'#412402', bg:'#FAEEDA' },
            { key:'glass',      label:'Glass',            color:'#26215C', bg:'#EEEDFE' },
            { key:'secondhand', label:'Secondhand',       color:'#4B1528', bg:'#FBEAF0' },
            { key:'others',     label:'Others',           color:'#2C2C2A', bg:'#F1EFE8' },
          ]
          const counts = breakdown.map(b => ({
            ...b,
            count: listings.filter(l => l.category === b.key).length,
            kg:    listings
              .filter(l => l.category === b.key && l.status === 'completed')
              .reduce((s, l) => s + (l.weight_estimate || 0), 0)
          }))
          const totalCount = counts.reduce((s, b) => s + b.count, 0) || 1
          return counts.map(b => (
            <div key={b.key} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{b.label}</span>
                <span className="font-medium" style={{ color: b.color }}>
                  {b.count} listings · {b.kg} kg diverted
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: b.bg }}>
                <div className="h-full rounded-full"
                  style={{
                    width: `${Math.round((b.count / totalCount) * 100)}%`,
                    backgroundColor: b.color,
                  }} />
              </div>
            </div>
          ))
        })()}
      </div>

      {/* Barangay activity */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Barangay Activity Map
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Geographic waste generation data for city planning
        </p>
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
            <div className="text-center py-8">
              <p className="text-sm text-gray-300">No barangay data yet</p>
            </div>
          )

          return sorted.map(([barangay, count], i) => (
            <div key={barangay} className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600 truncate">{barangay}</span>
                  <span className="font-medium ml-2" style={{ color:'#1A4D35' }}>{count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-full"
                    style={{ width:`${(count/max)*100}%`, backgroundColor:'#1A4D35' }} />
                </div>
              </div>
            </div>
          ))
        })()}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-5 mb-5">

      {/* Junkshop network */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Informal Collector Network
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Economic mapping of Baguio's recycling economy
        </p>
        <div className="space-y-2">
          {[
            { label:'Registered collectors',     value: stats.total_junkshops         },
            { label:'Verified collectors',        value: junkshops.filter(s => s.is_verified).length  },
            { label:'Total pickups completed',    value: stats.completed_pickups       },
            { label:'Active listings available',  value: stats.active_listings         },
            { label:'Est. economic value',
              value: `₱${(pickups.filter(p=>p.status==='completed').reduce((s,p)=>s+(p.offered_price||0),0)).toLocaleString()}`
            },
          ].map(row => (
            <div key={row.label}
              className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental impact */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Environmental Impact Report
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Suitable for DENR and international sustainability reporting
        </p>
        <div className="space-y-3">
          {[
            { label:'Total kg diverted from SLF', value:`${stats.kg_diverted.toLocaleString()} kg`,      icon:'♻️' },
            { label:'CO₂ emissions avoided',       value:`${(stats.kg_diverted*0.5).toFixed(1)} kg CO₂`, icon:'🌿' },
            { label:'Tree planting equivalent',    value:`${Math.floor(stats.kg_diverted/15)} trees`,     icon:'🌳' },
            { label:'Water conserved',             value:`${(stats.kg_diverted*2).toLocaleString()} L`,   icon:'💧' },
            { label:'E-waste properly handled',
              value:`${listings.filter(l=>l.category==='ewaste').reduce((s,l)=>s+(l.weight_estimate||0),0)} kg`,
              icon:'⚡'
            },
          ].map(row => (
            <div key={row.label}
              className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span>{row.icon}</span>
              <span className="flex-1 text-sm text-gray-500">{row.label}</span>
              <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Monthly trend */}
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
      <p className="text-sm font-medium text-gray-700 mb-1">Monthly Pickup Trend</p>
      <p className="text-xs text-gray-400 mb-5">
        Pickup volume over time — shows program growth for LGU reporting
      </p>
      {(() => {
        const months = {}
        pickups.forEach(p => {
          const month = new Date(p.created_at).toLocaleDateString('en-PH', { month:'short', year:'2-digit' })
          months[month] = (months[month] || 0) + 1
        })
        const entries = Object.entries(months).slice(-6)
        const max = Math.max(...entries.map(e => e[1]), 1)

        if (entries.length === 0) return (
          <div className="text-center py-8">
            <p className="text-sm text-gray-300">No trend data yet — appears after first pickups</p>
          </div>
        )

        return (
          <div className="flex items-end gap-3 h-32">
            {entries.map(([month, count]) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium" style={{ color:'#1A4D35' }}>{count}</span>
                <div className="w-full rounded-t-lg"
                  style={{ height:`${(count/max)*100}px`, minHeight:'4px', backgroundColor:'#D8F3DC' }}>
                  <div className="w-full h-full rounded-t-lg"
                    style={{ backgroundColor:'#1A4D35', opacity: 0.6 + (count/max*0.4) }} />
                </div>
                <span className="text-xs text-gray-400">{month}</span>
              </div>
            ))}
          </div>
        )
      })()}
    </div>

    {/* LGU Data Package info */}
    <div className="rounded-2xl p-5"
      style={{ backgroundColor:'#FAEEDA' }}>
      <div className="flex items-start gap-4">
        <div className="text-2xl">📊</div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color:'#7A3F08' }}>
            WAIZ Data Package
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color:'#854F0B' }}>
            Download a comprehensive CSV dataset to track waste diversion metrics, generate reports, and inform policy decisions. Updated in real-time with the latest listings, pickups, user registrations, and junkshop activity.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => exportCSV({ listings, pickups, users, junkshops })}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white"
              style={{ backgroundColor:'#C97A3A' }}>
              Download Full Dataset (CSV)
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-medium border"
              style={{ borderColor:'#C97A3A', color:'#C97A3A' }}>
              Print Report
            </button>
          </div>
        </div>
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