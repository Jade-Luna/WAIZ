import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabase/config'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/DashboardLayout'
import MapWidget from '../../components/BaguioMap'
import Messages from '../../components/Messages'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_STYLE = {
  requested: { bg:'#FAEEDA', color:'#7A3F08', label:'Requested' },
  offered:   { bg:'#E6F1FB', color:'#042C53', label:'Offer sent' },
  accepted:  { bg:'#D8F3DC', color:'#085041', label:'Accepted'  },
  completed: { bg:'#F3F4F6', color:'#6B7280', label:'Completed' },
  cancelled: { bg:'#FAECE7', color:'#993C1D', label:'Cancelled' },
}

const PRICE_FIELDS = [
  { key:'price_metal',      label:'Metal',      placeholder:'e.g. 14' },
  { key:'price_paper',      label:'Paper',      placeholder:'e.g. 3'  },
  { key:'price_plastic',    label:'Plastic',    placeholder:'e.g. 8'  },
  { key:'price_ewaste',     label:'E-waste',    placeholder:'e.g. 25' },
  { key:'price_glass',      label:'Glass',      placeholder:'e.g. 2'  },
  { key:'price_secondhand', label:'Secondhand', placeholder:'e.g. 5'  },
]



function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d    = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

export default function JunkshopDash() {
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const [viewRequest,  setViewRequest]  = useState(null)
const [offerPrice,   setOfferPrice]   = useState('')
const [offering,     setOffering]     = useState(false)
  const activeTab         = searchParams.get('tab') || 'requests'
    const [customRates,  setCustomRates]  = useState([
  { label:'', price:'' },
])

const addRate    = () => setCustomRates(prev => [...prev, { label:'', price:'' }])
const removeRate = (i) => setCustomRates(prev => prev.filter((_, idx) => idx !== i))
const updateRate = (i, field, val) => setCustomRates(prev =>
  prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
)

const handleSaveRates = async () => {
  setSavingPrices(true)
  const validRates = customRates.filter(r => r.label.trim() && r.price)
  await supabase.from('junkshops')
    .update({ custom_rates: validRates })
    .eq('id', user.id)
  setSavingPrices(false)
  setPricesSaved(true)
  setTimeout(() => setPricesSaved(false), 2500)
}
  const [requests, setRequests] = useState([])
  const [shop,     setShop]     = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [prices,       setPrices]       = useState({})
  const [savingPrices, setSavingPrices] = useState(false)
  const [pricesSaved,  setPricesSaved]  = useState(false)
  const [pickupHistory, setpickupHistory] = useState([])
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
  if (!user) return
  fetchData()

  // Real-time subscription for new pickup requests
  const channel = supabase
    .channel('pickup-updates')
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'pickups',
      filter: `junkshop_id=eq.${user.id}`,
    }, () => fetchData())
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user])

  const fetchData = async () => {
  setLoading(true)
  const { data: shopData } = await supabase
    .from('junkshops').select('*').eq('id', user.id).single()
  const { data: reqData } = await supabase
  .from('pickups')
  .select(`
    *,
    listings(title, barangay, weight_estimate, category),
    household:profiles!household_id(full_name, barangay)
  `)
  .eq('junkshop_id', user.id)
  .order('created_at', { ascending: false })

  if (shopData) {
  setShop(shopData)
  const p = {}
  PRICE_FIELDS.forEach(f => { p[f.key] = shopData[f.key] || '' })
  setPrices(p)

  // Load existing custom rates
  if (shopData.custom_rates && shopData.custom_rates.length > 0) {
    setCustomRates(shopData.custom_rates)
  } else {
    setCustomRates([{ label: '', price: '' }])
  }
}
  setRequests(reqData || [])
  setDataLoaded(true)
  setLoading(false)
}

  const handleSavePrices = async () => {
    setSavingPrices(true)
    const updates = {}
    PRICE_FIELDS.forEach(f => {
      updates[f.key] = prices[f.key] ? parseFloat(prices[f.key]) : null
    })
    await supabase.from('junkshops').update(updates).eq('id', user.id)
    setSavingPrices(false)
    setPricesSaved(true)
    setTimeout(() => setPricesSaved(false), 2500)
  }

 const handleUpdateStatus = async (id, status) => {
  await supabase.from('pickups').update({ status }).eq('id', id)
  if (status === 'completed') {
    const pickup = requests.find(r => r.id === id)
    if (pickup?.listing_id) {
      await supabase.from('listings')
        .update({ status: 'completed' })
        .eq('id', pickup.listing_id)
    }
  }
  setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  fetchData()
}

const handleOffer = async () => {
  if (!offerPrice || !viewRequest) return
  setOffering(true)
  const { error } = await supabase.from('pickups')
    .update({ offered_price: parseFloat(offerPrice), status: 'offered' })
    .eq('id', viewRequest.id)
  console.log('offer error:', JSON.stringify(error))
  setOffering(false)
  setOfferPrice('')
  setViewRequest(null)
  fetchData()
}

const pendingCount   = requests.filter(r => r.status === 'requested').length
const activeCount    = requests.filter(r => r.status === 'accepted').length
const completedCount = requests.filter(r => r.status === 'completed').length
const earnings = requests
  .filter(r => r.status === 'completed')
  .reduce((sum, r) => sum + (parseFloat(r.offered_price) || 0), 0)

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"

  return (
    <DashboardLayout activeTab={activeTab}>

      {/* HEADER CARD */}
      {!['messages', 'priceboard', 'profile'].includes(activeTab) && (
      <div className="rounded-2xl p-6 mb-6 flex items-center justify-between"
        style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'#52B788' }}>
            Junkshop Dashboard
          </p>
          <h1 className="text-2xl font-medium text-white">
            Good to see you, {shop?.shop_name || profile?.full_name || 'Your Shop'} 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm" style={{ color:'#74C69D' }}>{shop?.barangay || 'Baguio City'}</span>
            {shop?.is_verified && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor:'rgba(255,255,255,0.15)', color:'#B7E4C7' }}>
                ✓ Verified
              </span>
            )}
            {shop?.is_featured && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor:'rgba(201,122,58,0.3)', color:'#FAEEDA' }}>
                Featured
              </span>
            )}
          </div>
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

      {/* STAT CARDS */}
      {!['messages', 'priceboard', 'profile'].includes(activeTab) && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Pending requests', value: pendingCount,           bg:'#FAEEDA', color:'#7A3F08', sub:'awaiting action'   },
          { label:'Active pickups',   value: activeCount,            bg:'#D8F3DC', color:'#085041', sub:'in progress'       },
          { label:'Completed',        value: completedCount,         bg:'#E6F1FB', color:'#042C53', sub:'total done'        },
          { label:'Est. total paid', value:`₱${earnings.toLocaleString()}`, bg:'#EAF3DE', color:'#173404', sub:'to households' },
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

      {/* PICKUP REQUESTS */}
      {activeTab === 'requests' && (
        <div>
          <h2 className="text-base font-medium text-gray-700 mb-4">Pickup Requests</h2>
          {requests.filter(r => r.status === 'requested').length === 0 ? (
            <Empty icon="📭" text="No pending requests" sub="Browse listings and send pickup requests to households">
              <Link to="/browse"
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor:'#1A4D35' }}>
                Browse listings
              </Link>
            </Empty>
          ) : (
            <div className="space-y-3">
              {requests.filter(r => r.status === 'requested').map(req => (
                <RequestCard key={req.id} req={req} onUpdate={handleUpdateStatus} showActions onView={setViewRequest} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE PICKUPS */}
      {activeTab === 'accepted' && (
        <div>
          <h2 className="text-base font-medium text-gray-700 mb-4">Active Pickups</h2>
          {requests.filter(r => r.status === 'accepted').length === 0 ? (
            <Empty icon="🚚" text="No active pickups" sub="Accepted pickups will appear here" />
          ) : (
            <div className="space-y-3">
              {requests.filter(r => r.status === 'accepted').map(req => (
                <RequestCard key={req.id} req={req} onUpdate={handleUpdateStatus} showComplete />
              ))}
            </div>
          )}
        </div>
      )}

      {/* RATE BOARD */}
      {activeTab === 'priceboard' && (
  <div className="max-w-2xl">
    <h2 className="text-base font-medium text-gray-700 mb-1">Your buying rates</h2>
    <p className="text-sm text-gray-400 mb-5">
      Add your own material labels and set your buying price per kilo. Households will see this publicly.
    </p>

    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="space-y-3 mb-5">
        {customRates.map((rate, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
              placeholder="Material name (e.g. Copper, Plastic caps...)"
              value={rate.label}
              onChange={e => updateRate(i, 'label', e.target.value)}
            />
            <div className="flex items-center gap-2 w-36 shrink-0">
              <span className="text-sm text-gray-400">₱</span>
              <input
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
                type="number" min="0" step="0.5"
                placeholder="0.00"
                value={rate.price}
                onChange={e => updateRate(i, 'price', e.target.value)}
              />
              <span className="text-xs text-gray-400 shrink-0">/kg</span>
            </div>
            <button
              onClick={() => removeRate(i)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition shrink-0">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRate}
        className="w-full py-2.5 rounded-xl text-sm border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 transition mb-5">
        + Add material
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveRates}
          disabled={savingPrices}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition"
          style={{ backgroundColor: savingPrices ? '#52B788' : '#1A4D35' }}>
          {savingPrices ? 'Saving...' : 'Save rate board'}
        </button>
        {pricesSaved && (
          <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>✓ Saved</span>
        )}
      </div>

      <div className="mt-4 p-4 rounded-xl text-xs leading-relaxed"
        style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
        Rate changes are visible to households immediately. Add as many materials as you need.
      </div>
    </div>
  </div>
)}

      {/* MESSAGES */}
      {activeTab === 'messages' && <Messages />}

      {/* pickupHistory */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-base font-medium text-gray-700 mb-4">Pickup History</h2>
          {requests.filter(r => r.status === 'completed' || r.status === 'cancelled').length === 0 ? (
            <Empty icon="🕐" text="No Pickup History yet" sub="Completed pickups will appear here" />
          ) : (
            <div className="space-y-3">
              {requests
                .filter(r => r.status === 'completed' || r.status === 'cancelled')
                .map(req => <RequestCard key={req.id} req={req} onUpdate={handleUpdateStatus} />)}
            </div>
          )}
        </div>
      )}

      {/* SHOP PROFILE */}
      {activeTab === 'profile' && (
  <div>
    <h2 className="text-base font-medium text-gray-700 mb-4">Shop Profile</h2>
    <div className="grid grid-cols-2 gap-5">

      {/* Editable shop details */}
      <JunkshopProfileEditor shop={shop} user={user} />

      {/* Right column */}
      <div className="space-y-5">

        {/* Map */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-600 mb-1">Other junkshops in Baguio</p>
          <p className="text-xs text-gray-400 mb-3">See your competition and coverage areas</p>
          <div className="rounded-xl overflow-hidden">
            <MapWidget height="220px" showUserPin={false} />
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Your Analytics</p>
          {requests.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-xs text-gray-400">Analytics will appear after your first pickup</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label:'Total requests',   value: requests.length                                          },
                { label:'Completed pickups',value: requests.filter(r => r.status === 'completed').length    },
                { label:'Active pickups',   value: requests.filter(r => r.status === 'accepted').length     },
                { label:'Pending requests', value: requests.filter(r => r.status === 'requested').length    },
                { label:'Est. total paid',  value:`₱${earnings.toFixed(0)}`                                 },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-400">{s.label}</span>
                  <span className="text-xs font-medium" style={{ color:'#1A4D35' }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  </div>
)}
{viewRequest && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
    onClick={() => setViewRequest(null)}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md"
      onClick={e => e.stopPropagation()}>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-800">Pickup Request</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            from {viewRequest.household?.full_name || 'Household'}
          </p>
        </div>
        <button onClick={() => setViewRequest(null)}
          className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
      </div>

      <div className="space-y-3">
        {/* Materials */}
        {viewRequest.material_types?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Materials</p>
            <div className="flex flex-wrap gap-1.5">
              {viewRequest.material_types.map(m => (
                <span key={m} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weight */}
        {viewRequest.est_weight_kg && (
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-xs text-gray-400">Estimated weight</span>
            <span className="text-xs font-medium text-gray-700">~{viewRequest.est_weight_kg} kg</span>
          </div>
        )}

        {/* Preferred date */}
        {viewRequest.preferred_date && (
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-xs text-gray-400">Preferred date</span>
            <span className="text-xs font-medium text-gray-700">{viewRequest.preferred_date}</span>
          </div>
        )}

        {/* Note */}
        {viewRequest.note && (
          <div className="py-2 border-b border-gray-50">
            <p className="text-xs text-gray-400 mb-1">Note</p>
            <p className="text-xs text-gray-700">{viewRequest.note}</p>
          </div>
        )}

        {/* Photos */}
        {viewRequest.photos?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Photos</p>
            <div className="grid grid-cols-4 gap-2">
              {viewRequest.photos.map((src, i) => (
                <img key={i} src={src} alt=""
                  className="w-full aspect-square object-cover rounded-xl border border-gray-100" />
              ))}
            </div>
          </div>
        )}
      </div>

      {viewRequest?.status !== 'offered' && (
  <div className="mt-4 pt-4 border-t border-gray-100">
    <p className="text-xs font-medium text-gray-500 mb-2">Send a price offer</p>
    <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2">
      <span className="text-xs text-gray-400">₱</span>
      <input
        type="number" min="0" step="0.5"
        className="flex-1 text-sm outline-none"
        placeholder="Price per kg"
        value={offerPrice}
        onChange={e => setOfferPrice(e.target.value)}
      />
      <span className="text-xs text-gray-400">/kg</span>
    </div>
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => { onUpdate(viewRequest.id, 'cancelled'); setViewRequest(null) }}
        className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
        Decline
      </button>
      <button
        onClick={handleOffer}
        disabled={offering || !offerPrice}
        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ backgroundColor: offerPrice ? '#C97A3A' : '#9CA3AF' }}>
        {offering ? 'Sending...' : 'Send offer'}
      </button>
    </div>
  </div>
)}

<div className="flex gap-2 mt-5">
  <button
   onClick={() => navigate(
  `/dashboard/junkshop?tab=messages&contact=${viewRequest.household_id}`
)}
    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
    style={{ backgroundColor:'#1A4D35', color:'#fff' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  </button>
  <button onClick={() => { setViewRequest(null); setOfferPrice('') }}
    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
    style={{ backgroundColor:'#1A4D35' }}>
    Close
  </button>
</div>
  </div>
  </div>
)}
    </DashboardLayout>
  )
}

function RequestCard({ req, onUpdate, showActions, showComplete, onView }) {
  const [offerPrice, setOfferPrice] = useState('')
  const [offering,   setOffering]   = useState(false)

  const s        = STATUS_STYLE[req.status] || STATUS_STYLE.requested
  const title = req.listings?.title || req.listing_title || ('Request from ' + (req.household?.full_name || 'Household'))
  const barangay = req.listings?.barangay        || req.barangay       || '—'
  const weight   = req.listings?.weight_estimate || req.weight         || req.est_weight_kg || null
  const name     = req.household?.full_name      || req.profiles?.full_name || 'Household'


  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
        style={{ backgroundColor:'#D8F3DC', color:'#0D2B1F' }}>
        {name?.slice(0,2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-gray-700 truncate">{title}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          <span>{name}</span>
          <span>·</span>
          <span>{barangay}</span>
          {weight && <><span>·</span><span>~{weight} kg</span></>}
          {req.material_types?.length > 0 && (
            <><span>·</span><span>{req.material_types.join(', ')}</span></>
          )}
          {req.offered_price && (
            <><span>·</span>
            <span className="font-medium" style={{ color:'#1A4D35' }}>₱{req.offered_price}/kg</span></>
          )}
          {/* Request details for household-initiated pickups */}
          {req.preferred_date && (
            <><span>·</span>
            <span>Prefers {req.preferred_date}</span></>
          )}  
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {showActions && (
  req.listing_id ? (
    <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
      style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
      Awaiting household
    </span>
  ) : (
    req.status === 'offered' ? (
      <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
        style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
        Offer sent ✓
      </span>
    ) : (
      <button onClick={() => onView(req)}
        className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
        View details
      </button>
    )
  )
)}
        {showComplete && (
          <button onClick={() => onUpdate(req.id, 'completed')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor:'#1A4D35' }}>
            Mark done
          </button>
        )}
      </div>
    </div>
  )
}

function Empty({ icon, text, sub, children }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-500 mb-1">{text}</p>
      <p className="text-xs text-gray-400 mb-4">{sub}</p>
      {children}
    </div>
  )
}

function JunkshopProfileEditor({ shop, user }) {
  const [form, setForm] = useState({
    shop_name:  '',
    phone:      '',
    barangay:   '',
    dti_number: '',
    latitude:   null,
    longitude:  null,
  })
  const [photoFile,    setPhotoFile]    = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  useEffect(() => {
    if (shop) {
      setForm({
        shop_name:  shop.shop_name  || '',
        phone:      shop.phone      || '',
        barangay:   shop.barangay   || '',
        dti_number: shop.dti_number || '',
        latitude:   shop.latitude   || null,
        longitude:  shop.longitude  || null,
      })
      setPhotoPreview(shop.photo_url || null)
    }
  }, [shop])

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    let photoUrl = shop?.photo_url || null

    if (photoFile) {
      const ext  = photoFile.name.split('.').pop()
      const path = `shops/${user.id}.${ext}`
      const { error } = await supabase.storage
        .from('listing-photos')
        .upload(path, photoFile, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }
    }

    await supabase.from('junkshops').update({
      shop_name:  form.shop_name,
      dti_number: form.dti_number || null,
      photo_url:  photoUrl,
      latitude:   form.latitude,
      longitude:  form.longitude,
    }).eq('id', user.id)

    await supabase.from('profiles').update({
      full_name: form.shop_name,
      phone:     form.phone,
      barangay:  form.barangay,
    }).eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"

  const BARANGAYS = [
    'Burnham-Legarda','Cabinet Hill','Camp 7','Camp 8','City Camp Central',
    'Dominican Hill-Mirador','Dontogan','Engineers Hill','Fairview Village',
    'Holy Ghost Extension','Holy Ghost Proper','Honeymoon','Irisan','Kabayanihan',
    'Kias','Loakan Proper','Loakan Road','Lualhati','Magsaysay Lower','Magsaysay Upper',
    'Mines View Park','New Lucban','Pacdal','Padre Burgos','Phil-Am','Pinget',
    'Pinsao Pilot','Pinsao Proper','Quirino Hill East','Quirino Hill Lower',
    'Quirino Hill Proper','Quirino Hill West','Rock Quarry','Salud Mitra',
    'San Antonio Village','San Luis Village','San Roque Village','San Vicente',
    'Santo Rosario','Santo Tomas Proper','Session Road','Sierra Vista',
    'South Drive','Teodora Alonzo','Trancoville','Victoria Village',
  ]

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <p className="text-sm font-medium text-gray-600">Shop information</p>

      <div className="flex items-center gap-4">
        <label className="cursor-pointer relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100"
            style={{ backgroundColor:'#D8F3DC' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="shop" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-medium"
                style={{ color:'#1A4D35' }}>
                {form.shop_name?.slice(0,2).toUpperCase() || 'JS'}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor:'#1A4D35' }}>+</div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </label>
        <div>
          <p className="text-sm font-medium text-gray-700">Shop photo</p>
          <p className="text-xs text-gray-400 mt-0.5">Visible to all households</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Shop name</label>
        <input className={inputClass} placeholder="Your junkshop name"
          value={form.shop_name} onChange={e => update('shop_name', e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Contact number</label>
        <input className={inputClass} placeholder="09XX XXX XXXX"
          value={form.phone} onChange={e => update('phone', e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Barangay</label>
        <select className={inputClass}
          value={form.barangay}
          onChange={e => update('barangay', e.target.value)}>
          <option value="">Select your barangay...</option>
          {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          DTI Registration No.
          <span className="font-normal text-gray-300 ml-1">(optional)</span>
        </label>
        <input className={inputClass} placeholder="DTI-XXXXXXXXX"
          value={form.dti_number} onChange={e => update('dti_number', e.target.value)} />
      </div>

      {/* Location picker */}
<div>
  <label className="block text-xs font-medium text-gray-500 mb-1.5">
    Pin your shop location
  </label>
  <p className="text-xs text-gray-400 mb-2">
    Click anywhere on the map to pin your exact location
  </p>
  <div className="rounded-xl overflow-hidden border border-gray-200"
    style={{ height:'220px' }}>
    <LocationPicker
  lat={form.latitude}
  lng={form.longitude}
  onChange={(lat, lng) => setForm(p => ({ ...p, latitude: lat, longitude: lng }))}
  key="location-picker-stable"
/>
  </div>
  {form.latitude && (
    <p className="text-xs mt-1.5" style={{ color:'#1A4D35' }}>
      ✓ Location pinned — households can now get directions to your shop
    </p>
  )}
</div>

      <div className="pt-2 border-t border-gray-50 space-y-1">
        {[
          { label:'Rating',   value: shop?.rating       ? `★ ${shop.rating}` : '—' },
          { label:'Pickups',  value: shop?.total_pickups ?? 0                       },
          { label:'Verified', value: shop?.is_verified  ? '✓ Verified' : 'Pending'  },
          { label:'Featured', value: shop?.is_featured  ? 'Yes' : 'Not featured'    },
        ].map(row => (
          <div key={row.label} className="flex justify-between py-1">
            <span className="text-sm text-gray-400">{row.label}</span>
            <span className="text-sm font-medium text-gray-600">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: saving ? '#52B788' : '#1A4D35' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saved && (
          <span className="text-sm font-medium" style={{ color:'#1A4D35' }}>✓ Saved</span>
        )}
      </div>

      <div className="p-3 rounded-xl text-xs" style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
        To apply for Featured placement, contact <a href="mailto:supportwaiz@gmail.com" style={{ color:'#1A4D35' }}>support@waiz.ph</a>
      </div>
    </div>
  )
}

function LocationPicker({ lat, lng, onChange }) {
  const defaultCenter = [16.4023, 120.5960]
  const [searchInput,  setSearchInput]  = useState('')
  const [searching,    setSearching]    = useState(false)
  const [searchCoords, setSearchCoords] = useState(null)
  const [pendingPin,   setPendingPin]   = useState(null)

  const pinIcon = new L.DivIcon({
    className: '',
    html: `<div style="background:#C97A3A;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);color:#fff;font-size:11px;text-align:center;line-height:24px">♻</div></div>`,
    iconSize:  [28,28], iconAnchor:[14,28],
  })

  useEffect(() => {
    if (pendingPin) {
      onChange(pendingPin[0], pendingPin[1])
    }
  }, [pendingPin])

  const handleSearch = async () => {
    if (!searchInput.trim()) return
    setSearching(true)
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput + ', Baguio City, Philippines')}&format=json&limit=1`)
      const data = await res.json()
      if (data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        setSearchCoords(coords)
      }
    } catch (e) { console.error(e) }
    setSearching(false)
  }

  function FlyToLocation({ coords }) {
    const map = useMap()
    useEffect(() => {
      if (coords) map.flyTo(coords, 99)
    }, [coords])
    return null
  }

  function ClickHandler() {
    useMapEvents({
      click(e) { setPendingPin([e.latlng.lat, e.latlng.lng]) }
    })
    return null
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
          placeholder="Search your street or landmark in Baguio..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={searching}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white shrink-0"
          style={{ backgroundColor:'#1A4D35' }}>
          {searching ? '...' : 'Search'}
        </button>
        <button
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(pos => {
              const coords = [pos.coords.latitude, pos.coords.longitude]
              setSearchCoords(coords)
              setPendingPin(coords)
            })
          }}
          className="px-3 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0"
          title="Use my current location">
          📍
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height:'240px' }}>
        <MapContainer
          center={lat && lng ? [lat, lng] : defaultCenter}
          zoom={15}
          style={{ height:'100%', width:'100%' }}
          scrollWheelZoom={true}>
          <TileLayer
            attribution='© OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToLocation coords={searchCoords} />
          <ClickHandler />
          {lat && lng && <Marker position={[lat, lng]} icon={pinIcon} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        Search your street above, or click directly on the map to drop your pin
      </p>
    </div>
  )
}