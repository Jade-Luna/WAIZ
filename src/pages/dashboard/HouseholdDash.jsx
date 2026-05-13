import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase/config'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/DashboardLayout'
import MapWidget from '../../components/BaguioMap'
import Messages from '../../components/Messages'

const STATUS_STYLE = {
  available: { bg:'#D8F3DC', color:'#085041', label:'Available'     },
  pending:   { bg:'#FAEEDA', color:'#7A3F08', label:'Pending pickup' },
  offered:   { bg:'#E6F1FB', color:'#042C53', label:'Offer received' },
  completed: { bg:'#F3F4F6', color:'#6B7280', label:'Completed'     },
}

const CAT_COLORS = {
  metal:      { bg:'#E1F5EE', color:'#085041' },
  paper:      { bg:'#EAF3DE', color:'#173404' },
  plastic:    { bg:'#E6F1FB', color:'#042C53' },
  ewaste:     { bg:'#FAEEDA', color:'#412402' },
  glass:      { bg:'#EEEDFE', color:'#26215C' },
  secondhand: { bg:'#FBEAF0', color:'#4B1528' },
}


const IMPACT_FORMULAS = {
  co2:   kg => (kg * 0.5).toFixed(1),
  trees: kg => Math.floor(kg / 15),
  water: kg => Math.round(kg * 2),
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d    = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

export default function HouseholdDash() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams]    = useSearchParams()
  const activeTab         = searchParams.get('tab') || 'listings'
  const [listings, setListings]   = useState([])
  const [requests, setRequests]   = useState([])
  const [history,  setHistory]    = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [deleteId, setDeleteId]   = useState(null)
  const [receiptPickup, setReceiptPickup] = useState(null)
  const [loading,  setLoading]    = useState(false)

  useEffect(() => {
  if (!user) return
  fetchData()

  // Real-time subscription for pickup status changes
  const channel = supabase
    .channel('household-pickup-updates')
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'pickups',
      filter: `household_id=eq.${user.id}`,
    }, () => fetchData())
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user])

const fetchData = async () => {
  setLoading(true)

  const { data: listData } = await supabase
    .from('listings')
    .select('*')
    .eq('posted_by', user.id)
    .order('created_at', { ascending: false })

  const { data: pickupData } = await supabase
    .from('pickups')
    .select('*, listings(title, category, barangay)')
    .eq('household_id', user.id)
    .order('created_at', { ascending: false })

  const enrichedPickups = await Promise.all((pickupData || []).map(async (pickup) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, barangay')
      .eq('id', pickup.junkshop_id)
      .single()
    return {
      ...pickup,
      junkshop: profileData
        ? { shop_name: profileData.full_name, barangay: profileData.barangay, is_verified: false }
        : null
    }
  }))

  setListings(listData || [])
  setHistory(enrichedPickups.filter(p => p.status === 'completed' || p.status === 'cancelled'))
  setRequests(enrichedPickups.filter(p => p.status === 'requested' || p.status === 'offered' || p.status === 'accepted'))
  setLoading(false)
}

  const handleDelete = async (id) => {
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleteId(null)
  }

  const handlePickupAction = async (id, status) => {
  const pickup = requests.find(r => r.id === id)
  const { error } = await supabase.from('pickups').update({ status }).eq('id', id)
  console.log('update error:', JSON.stringify(error))
  await supabase.from('pickups').update({ status }).eq('id', id)
  if (status === 'cancelled' && pickup?.listing_id) {
    await supabase.from('listings')
      .update({ status: 'available' })
      .eq('id', pickup.listing_id)
  }
  if (status === 'accepted' && pickup?.listing_id) {
    await supabase.from('listings')
      .update({ status: 'pending' })
      .eq('id', pickup.listing_id)
  }
   if (status === 'cancelled') {
    setRequests(prev => prev.filter(r => r.id !== id))
    return
  }
  setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  awaitfetchData()
}

  const totalKg        = listings.filter(l => l.status === 'completed').reduce((s, l) => s + (l.weight_estimate || 0), 0)
  const totalEarned = history.reduce((s, h) => {
  return s + parseFloat(h.offered_price || 0)
}, 0)
  const activeCount    = listings.filter(l => l.status === 'available').length
  const pendingCount   = listings.filter(l => l.status === 'pending').length
  const completedCount = listings.filter(l => l.status === 'completed').length

  return (
    <DashboardLayout activeTab={activeTab}>

      {/* HEADER CARD - only show on main tabs */}
{!['messages','map','profile'].includes(activeTab) && (
  <div className="rounded-2xl p-4 md:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
    <div>
      <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'#52B788' }}>
        Household Dashboard
      </p>
      <h1 className="text-2xl font-medium text-white">
        Good to see you, {profile?.full_name?.split(' ')[0] || 'there'} 👋
      </h1>
      <p className="text-sm mt-1" style={{ color:'#74C69D' }}>
        {profile?.barangay || 'Baguio City'} · {listings.length} listing{listings.length !== 1 ? 's' : ''} posted
      </p>
    </div>
    <div className="flex gap-2 shrink-0">
  <Link to="/browse"
    className="px-5 py-2.5 rounded-xl text-sm font-medium"
    style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'#fff' }}>
    Marketplace
  </Link>
  <Link to="/junkshops"
    className="px-5 py-2.5 rounded-xl text-sm font-medium"
    style={{ backgroundColor:'#C97A3A', color:'#fff' }}>
    Junkshops
  </Link>
</div>
  </div>
)}

      {/* STAT CARDS - only show on main tabs */}
{!['messages','map','profile'].includes(activeTab) && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    {[
      { label:'Active listings',   value: activeCount,    bg:'#D8F3DC', color:'#085041', sub:'available now'    },
      { label:'Pending pickups',   value: pendingCount,   bg:'#FAEEDA', color:'#7A3F08', sub:'awaiting pickup'  },
      { label:'Completed',         value: completedCount, bg:'#E6F1FB', color:'#042C53', sub:'total done'       },
      { label:'Total earned',      value:`₱${totalEarned}`, bg:'#EAF3DE', color:'#173404', sub:'from all pickups' },
    ].map(stat => (
      <div key={stat.label} className="rounded-2xl p-5"
        style={{ backgroundColor: stat.bg }}>
        <div className="text-2xl font-medium mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
        <div className="text-xs font-medium" style={{ color: stat.color }}>{stat.label}</div>
        <div className="text-xs mt-1 opacity-70" style={{ color: stat.color }}>{stat.sub}</div>
      </div>
    ))}
  </div>
)}

      {/* MY LISTINGS */}
      {activeTab === 'listings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-700">My Listings</h2>
            <Link to="/post-item"
              className="text-xs px-4 py-2 rounded-xl font-medium text-white"
              style={{ backgroundColor:'#1A4D35' }}>
              + New listing
            </Link>
          </div>
          {listings.length === 0 ? (
            <Empty icon="📦" text="No listings yet" sub="Post your first recyclable item" action="/post-item" actionLabel="Post now" />
          ) : (
            <div className="space-y-3">
              {listings.map(l => {
                const s   = STATUS_STYLE[l.status] || STATUS_STYLE.available
                const cat = CAT_COLORS[l.category] || CAT_COLORS.metal
                return (
                  <div key={l.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
                      style={{ backgroundColor: cat.bg, color: cat.color }}>
                      {l.category?.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-700 truncate">{l.title}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
                          style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        <span>{l.barangay}</span>
                        {l.weight_estimate && <><span>·</span><span>~{l.weight_estimate} kg</span></>}
                        <span>·</span><span>{timeAgo(l.created_at)}</span>
                        {l.pickup_requests > 0 && (
                          <><span>·</span>
                          <span className="font-medium" style={{ color:'#160e07' }}>
                            {l.pickup_requests} request{l.pickup_requests > 1 ? 's' : ''}
                          </span></>
                        )}
                      </div>
                    </div>
<div className="flex gap-2 shrink-0">
  {l.status === 'available' && (
    <button onClick={() => setDeleteId(l.id)}
      className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition">
      Remove
    </button>
  )}
  {l.status === 'available' && (
    <button
      onClick={() => navigate(`/listing/${l.id}/edit`)}
      className="px-3 py-1.5 rounded-lg text-xs border font-medium"
      style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
      Edit
    </button>
  )}
  <button
    onClick={() => navigate(`/listing/${l.id}`)}
    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
    style={{ backgroundColor:'#1A4D35' }}>
    View
  </button>
</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* PICKUP REQUESTS */}
      {activeTab === 'requests' && (
        <div>
          <h2 className="text-base font-medium text-gray-700 mb-4">Pickup Requests</h2>
          {requests.length === 0 ? (
            <Empty icon="📬" text="No pickup requests yet" sub="Post an item to start receiving requests" />
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
  style={{ backgroundColor:'#D8F3DC', color:'#0D2B1F' }}>
  {(req.junkshop?.shop_name || 'JS').slice(0,2).toUpperCase()}
</div>
<div className="flex-1 min-w-0">
  <div className="text-sm font-medium text-gray-700 mb-1">
    {req.junkshop?.shop_name || 'Junkshop'}
  </div>
  <div className="text-xs text-gray-400">
    For: <span className="text-gray-600">{req.listings?.title || 'Item'}</span>
    <span className="mx-2">·</span>
    Offered: <span className="font-medium" style={{ color:'#1A4D35' }}>₱{req.offered_price}/kg</span>
    {req.junkshop?.barangay && <><span className="mx-2">·</span>{req.junkshop.barangay}</>}
  </div>
</div>
                  <div className="flex gap-2 shrink-0">
  {req.listing_id ? (
    <>
      <button
        onClick={() => handlePickupAction(req.id, 'cancelled')}
        className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
        Decline
      </button>
      <button
        onClick={() => handlePickupAction(req.id, 'accepted')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
        style={{ backgroundColor:'#C97A3A' }}>
        Accept
      </button>
    </>
  ) : req.status === 'offered' ? (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium" style={{ color:'#1A4D35' }}>
        ₱{req.offered_price}/kg offered
      </span>
      <button
        onClick={() => handlePickupAction(req.id, 'cancelled')}
        className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
        Decline
      </button>
      <button
        onClick={() => handlePickupAction(req.id, 'accepted')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
        style={{ backgroundColor:'#C97A3A' }}>
        Accept
      </button>
    </div>
  ) : req.status === 'accepted' ? (
    <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
      style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
      Pickup confirmed ✓
    </span>
  ) : (
    <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
      style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
      Awaiting junkshop offer
    </span>
  )}
</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      {activeTab === 'messages' && <Messages />}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-base font-medium text-gray-700 mb-4">Pickup History</h2>
          {history.length === 0 ? (
            <Empty icon="🕐" text="No completed pickups yet" sub="Your pickup history will appear here" />
          ) : (
            <div className="space-y-3">
              {history.map(h => (
  <div key={h.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
      style={{ backgroundColor:'#D8F3DC', color:'#0D2B1F' }}>
      {(h.junkshop?.shop_name || h.junkshop?.full_name || 'JS').slice(0,2).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-700">
        {h.listings?.title || h.listing_title || 'Pickup'}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        {h.junkshop?.shop_name || h.junkshop?.full_name || 'Junkshop'} · {h.scheduled_date || h.date || 'Completed'}
      </div>
    </div>
    <div className="text-right shrink-0 flex flex-col items-end gap-1">
      <div className="text-sm font-medium" style={{ color:'#1A4D35' }}>
        ₱{h.offered_price || h.agreed_price || 0}
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
        Completed
      </span>
      <button
        onClick={() => setReceiptPickup(h)}
        className="text-xs px-2.5 py-1 rounded-lg border mt-1"
        style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
        View receipt
      </button>
    </div>
  </div>
))}
            </div>
          )}
        </div>
      )}

{/* MAP */}
{activeTab === 'map' && (
  <div>
    <div className="mb-5">
      <h2 className="text-base font-medium text-gray-700">Junkshops near you</h2>
      <p className="text-sm text-gray-400 mt-0.5">Click any pin to see buying rates</p>
    </div>
    <div className="flex items-center gap-5 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor:'#C97A3A' }} />
        <span className="text-xs text-gray-500">Featured shop</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor:'#1A4D35' }} />
        <span className="text-xs text-gray-500">Registered shop</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor:'#3B82F6' }} />
        <span className="text-xs text-gray-500">Your location</span>
      </div>
    </div>
    <div className="rounded-2xl overflow-hidden border border-gray-100 mb-5">
      <MapWidget height="460px" showUserPin={true} userBarangay={profile?.barangay} />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <ShopListFromDB />
    </div>
  </div>
)}

      {/* PROFILE */}
      {activeTab === 'profile' && (
  <div className="grid grid-cols-2 gap-6">

    {/* Left — Profile editor */}
    <ProfileEditor profile={profile} user={user} onSaved={fetchData} />

    {/* Right — My Impact */}
    <div>
      <h2 className="text-base font-medium text-gray-700 mb-4">Your Environmental Impact</h2>

      <div className="rounded-2xl p-5 mb-4"
        style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
        <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'#52B788' }}>
          Total recycled
        </p>
        <div className="text-3xl font-medium text-white mb-1">{totalKg} kg</div>
        <p className="text-sm" style={{ color:'#74C69D' }}>
          {totalKg === 0 ? 'Post your first item to start!' : 'diverted from Baguio\'s landfills'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label:'CO₂ saved',   value: totalKg > 0 ? `${(totalKg*0.5).toFixed(1)} kg` : '0 kg', bg:'#D8F3DC', color:'#085041', icon:'🌿' },
          { label:'Trees',       value: totalKg > 0 ? `${Math.floor(totalKg/15)}`       : '0',    bg:'#EAF3DE', color:'#173404', icon:'🌳' },
          { label:'Water saved', value: totalKg > 0 ? `${(totalKg*2).toFixed(0)} L`    : '0 L',  bg:'#E6F1FB', color:'#042C53', icon:'💧' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-4 text-center" style={{ backgroundColor: item.bg }}>
            <div className="text-xl mb-1">{item.icon}</div>
            <div className="text-base font-medium" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-0.5" style={{ color: item.color }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs font-medium text-gray-600 mb-3">Milestones</p>
        {[
          { label:'First listing posted',   done: listings.length > 0  },
          { label:'First pickup completed', done: completedCount > 0    },
          { label:'10 kg recycled',         done: totalKg >= 10         },
          { label:'50 kg recycled',         done: totalKg >= 50         },
          { label:'100 kg recycled',        done: totalKg >= 100        },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
              style={{ backgroundColor: m.done ? '#D8F3DC' : '#F3F4F6', color: m.done ? '#085041' : '#9CA3AF' }}>
              {m.done ? '✓' : '○'}
            </div>
            <span className="text-xs" style={{ color: m.done ? '#1A4D35' : '#9CA3AF' }}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-medium text-gray-800 mb-2">Remove this listing?</h3>
            <p className="text-sm text-gray-400 mb-5">This permanently removes the listing and cancels any pending requests.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">Cancel</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor:'#DC2626' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
{receiptPickup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
    onClick={() => setReceiptPickup(null)}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm"
      onClick={e => e.stopPropagation()}>

      {/* Receipt header */}
      <div className="text-center mb-5">
        <div className="text-2xl font-medium tracking-widest mb-1" style={{ color:'#1A4D35' }}>
          WA<span style={{ color:'#C97A3A' }}>I</span>Z
        </div>
        <p className="text-xs text-gray-400">Pickup Receipt</p>
      </div>

      <div className="border-t border-b border-dashed border-gray-200 py-4 space-y-2 mb-4">
        {[
          { label:'Item',      value: receiptPickup.listings?.title || 'Pickup'                           },
          { label:'Junkshop',  value: receiptPickup.junkshop?.shop_name || receiptPickup.junkshop?.full_name || 'Junkshop' },
          { label:'Date',      value: receiptPickup.scheduled_date || receiptPickup.date || 'Completed'   },
          { label:'Amount',    value: `₱${receiptPickup.offered_price || receiptPickup.agreed_price || 0}` },
          { label:'Status',    value: 'Completed ✓'                                                       },
        ].map(row => (
          <div key={row.label} className="flex justify-between">
            <span className="text-xs text-gray-400">{row.label}</span>
            <span className="text-xs font-medium text-gray-700">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-400 mb-4">
        Thank you for recycling with WAIZ 🌿<br/>
        Baguio City's Green Marketplace
      </div>

      <button onClick={() => setReceiptPickup(null)}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ backgroundColor:'#1A4D35' }}>
        Close
      </button>
    </div>
  </div>
)}
    </DashboardLayout>
  )
}

function Empty({ icon, text, sub, action, actionLabel }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-500 mb-1">{text}</p>
      <p className="text-xs text-gray-400 mb-4">{sub}</p>
      {action && (
        <Link to={action} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor:'#1A4D35' }}>{actionLabel}</Link>
      )}
    </div>
  )
}

function ShopListFromDB() {
  const [shops, setShops] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('junkshops').select('*, profiles(full_name)')
      .order('is_featured', { ascending: false })
      .then(({ data }) => setShops(data || []))
  }, [])

  // ✅ Verified only by default, all when searching
const filtered = shops.filter(s => {
  const matchesSearch =
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.barangay?.toLowerCase().includes(search.toLowerCase())
  if (search.trim().length > 0) return matchesSearch
  return matchesSearch && s.is_verified
})

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-4 bg-white">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.3"/>
          <path d="M11 11l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <input className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
          placeholder="Search junkshops by name or barangay..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">
            {shops.length === 0
              ? 'No junkshops have registered yet'
              : 'No junkshops match your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-4"
              style={{ border: s.is_featured ? '2px solid #2D6A4F' : '1px solid #F3F4F6' }}>
              {s.is_featured && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2"
                  style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>Featured</span>
              )}
              <div className="text-sm font-medium text-gray-700">{s.shop_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {s.is_verified ? '✓ Verified · ' : ''}{s.barangay}
              </div>
              {s.custom_rates && s.custom_rates.length > 0 && (
                <div className="text-xs mt-2" style={{ color:'#1A4D35' }}>
                  {s.custom_rates.slice(0,2).map(r => `${r.label} ₱${r.price}/kg`).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileEditor({ profile, user, onSaved }) {
  const [form, setForm] = useState({
  full_name: profile?.full_name || '',
  phone:     profile?.phone     || '',
  barangay:  profile?.barangay  || '',
})
  const [photoFile,    setPhotoFile]    = useState(null)
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || null)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [barangayInput,       setBarangayInput]       = useState(profile?.barangay || '')
  const [barangaySuggestions, setBarangaySuggestions] = useState([])

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone:     profile.phone     || '',
        barangay:  profile.barangay  || '',
      })
      setBarangayInput(profile.barangay || '')
      setPhotoPreview(profile.avatar_url || null)
    }
  }, [profile])

  const BARANGAYS = [
    'Abanao-Zandueta-Kayong-Chugum-Otek','Andres Bonifacio','Aurora Hill Proper',
    'Bayan Park','Burnham-Legarda','Cabinet Hill-Teacher\'s Camp','Camp 7','Camp 8',
    'Camp Allen','Campo Filipino','City Camp Central','City Camp Proper',
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

  const handleBarangayInput = (val) => {
    setBarangayInput(val)
    setForm(p => ({ ...p, barangay: val }))
    if (val.length < 2) { setBarangaySuggestions([]); return }
    setBarangaySuggestions(
      BARANGAYS.filter(b => b.toLowerCase().includes(val.toLowerCase())).slice(0,5)
    )
  }

  const selectBarangay = (b) => {
    setBarangayInput(b)
    setForm(p => ({ ...p, barangay: b }))
    setBarangaySuggestions([])
  }

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    let avatarUrl = profile?.avatar_url || null
    if (photoFile) {
      const ext  = photoFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-photos').upload(path, photoFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }
    }
    const { error: updateError } = await supabase
      .from('profiles').update({ ...form, avatar_url: avatarUrl }).eq('id', user.id)
    setSaving(false)
    if (updateError) { setError(updateError.message) }
    else { setSaved(true); if (onSaved) onSaved(user.id); setTimeout(() => setSaved(false), 2500) }
  }

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-medium text-gray-700 mb-4">Profile & Settings</h2>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100"
              style={{ backgroundColor:'#D8F3DC' }}>
              {photoPreview ? (
                <img src={photoPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-medium"
                  style={{ color:'#1A4D35' }}>
                  {form.full_name?.slice(0,2).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor:'#1A4D35' }}>+</div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile photo</p>
            <p className="text-xs text-gray-400 mt-0.5">Click to upload · JPG or PNG</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full name</label>
          <input className={inputClass} placeholder="Your full name"
            value={form.full_name} onChange={e => update('full_name', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone number</label>
          <input className={inputClass} placeholder="09XX XXX XXXX"
            value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Barangay</label>
          <input className={inputClass}
            placeholder="Type to search barangay..."
            value={barangayInput}
            onChange={e => handleBarangayInput(e.target.value)} />
          {barangaySuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {barangaySuggestions.map(b => (
                <button key={b} onClick={() => selectBarangay(b)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition">
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pt-2 border-t border-gray-50 space-y-2">
          {[
            { label:'Role',     value:'Household' },
            { label:'Joined',   value: profile ? new Date(profile.created_at).toLocaleDateString() : '—' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1">
              <span className="text-sm text-gray-400">{row.label}</span>
              <span className="text-sm font-medium text-gray-600">{row.value}</span>
            </div>
          ))}
        </div>
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor:'#FAECE7', color:'#993C1D' }}>{error}</div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition"
            style={{ backgroundColor: saving ? '#52B788' : '#1A4D35' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>✓ Updated</span>}
        </div>
      </div>
    </div>
  )
}