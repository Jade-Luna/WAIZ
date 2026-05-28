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
const [acceptedMaterials, setAcceptedMaterials] = useState([])

const toggleMaterial = (m) => {
  setAcceptedMaterials(prev =>
    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
  )
}
const addRate    = () => setCustomRates(prev => [...prev, { label:'', price:'' }])
const removeRate = (i) => setCustomRates(prev => prev.filter((_, idx) => idx !== i))
const updateRate = (i, field, val) => setCustomRates(prev =>
  prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
)

const handleSaveRates = async () => {
  setSavingPrices(true)
  const validRates = customRates.filter(r => r.label.trim() && r.price)
  await supabase.from('junkshops')
    .update({ custom_rates: validRates, accepted_materials: acceptedMaterials })
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
  const [ratingHousehold, setRatingHousehold] = useState(null)
  const [householdRatingScore, setHouseholdRatingScore] = useState(0)
  const [householdRatingDone, setHouseholdRatingDone] = useState(false)
  const [confirmPickup, setConfirmPickup] = useState(null)
  const [confirmForm, setConfirmForm] = useState({ actual_weight_kg:'', final_price:'', completion_notes:'' })

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
  if (shopData.accepted_materials && shopData.accepted_materials.length > 0) {
  setAcceptedMaterials(shopData.accepted_materials)
}
}
  const enrichedRequests = await Promise.all((reqData || []).map(async (pickup) => {
  const { data: householdRatings } = await supabase
    .from('household_ratings')
    .select('score')
    .eq('household_id', pickup.household_id)

  const avgRating = householdRatings?.length > 0
    ? (householdRatings.reduce((s, r) => s + r.score, 0) / householdRatings.length).toFixed(1)
    : null

  return { ...pickup, household_avg_rating: avgRating, household_rating_count: householdRatings?.length || 0 }
}))

setRequests(enrichedRequests)
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

 const handleUpdateStatus = async (id, status, req) => {
  if (status === 'completed') {
    setRatingHousehold(req)
    return
  }
  await supabase.from('pickups').update({ status }).eq('id', id)
  setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  fetchData()
}

const handleCompleteAndRate = async (score) => {
  if (!ratingHousehold) return
  const id = ratingHousehold.id

  await supabase.from('pickups').update({
    status: 'completed',
    actual_weight_kg: confirmForm.actual_weight_kg ? parseFloat(confirmForm.actual_weight_kg) : null,
    final_price: confirmForm.final_price ? parseFloat(confirmForm.final_price) : null,
    completion_notes: confirmForm.completion_notes || null,
  }).eq('id', id)

  const { data: shopData } = await supabase
    .from('junkshops').select('total_pickups').eq('id', user.id).single()
  await supabase.from('junkshops')
    .update({ total_pickups: (shopData?.total_pickups || 0) + 1 })
    .eq('id', user.id)

  if (ratingHousehold.listing_id) {
    await supabase.from('listings').update({ status: 'completed' }).eq('id', ratingHousehold.listing_id)
  }
  if (score > 0) {
    await supabase.from('household_ratings').insert({
      pickup_id: id,
      junkshop_id: user.id,
      household_id: ratingHousehold.household_id,
      score,
    })
  }
  setHouseholdRatingDone(true)
  setTimeout(() => {
    setRatingHousehold(null)
    setHouseholdRatingScore(0)
    setHouseholdRatingDone(false)
    fetchData()
  }, 2000)
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
                style={{ backgroundColor:'rgba(255,255,255,0.35)', color:'#B7E4C7' }}>
                ✓ Verified
              </span>
            )}
            {shop?.is_featured && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor:'rgba(201,122,58,0.5)', color:'#FAEEDA' }}>
                Featured
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
  <Link to="/browse"
    className="px-5 py-2.5 rounded-xl text-sm font-medium"
    style={{ backgroundColor:'rgba(255,255,255,0.35)', color:'#fff' }}>
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
      {!['messages', 'priceboard', 'profile', 'calendar'].includes(activeTab) && (
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
                <RequestCard key={req.id} req={req} onUpdate={handleUpdateStatus} showComplete onSetConfirm={(r) => { setConfirmPickup(r); setConfirmForm({ actual_weight_kg:'', final_price:'', completion_notes:'' }) }} cardStyle={{borderLeft: '4px solid #C97A3A', backgroundColor: '#C97A3A08', boxShadow: '0 2px 8px rgba(45,90,39,0.06)'}} />
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
                <RequestCard key={req.id} req={req} onUpdate={handleUpdateStatus} showComplete
  onSetConfirm={(r) => { setConfirmPickup(r); setConfirmForm({ actual_weight_kg:'', final_price:'', completion_notes:'' }) }} cardStyle={{borderLeft: '4px solid #1A4D35', backgroundColor: '#1A4D3508', boxShadow: '0 2px 8px rgba(45,90,39,0.06)'}} />
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

<div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
  <p className="text-xs font-medium text-gray-600 mb-3">What materials do you accept?</p>
  <div className="grid grid-cols-3 gap-2">
    {['Metal', 'Paper', 'Plastic', 'E-waste', 'Glass', 'Secondhand'].map(m => (
      <label key={m} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer py-1">
        <input type="checkbox"
          checked={acceptedMaterials.includes(m)}
          onChange={() => toggleMaterial(m)}
          style={{ accentColor:'#1A4D35', width:'16px', height:'16px' }} />
        {m}
      </label>
    ))}
  </div>
  <p className="text-xs text-gray-400 mt-3">This shows on your public profile so households know what to bring.</p>
</div>

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

{/* CALENDAR */}
      {activeTab === 'calendar' && (
        <PickupCalendar pickups={requests} role="junkshop" />
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
                .map(req => <RequestCard key={req.id} req={req} onUpdate={handleUpdateStatus} cardStyle={{borderLeft: '4px solid #085041', backgroundColor: '#08504108', boxShadow: '0 2px 8px rgba(45,90,39,0.06)'}} />)}
            </div>
          )}
        </div>
      )}

      {/* SHOP PROFILE */}
      {activeTab === 'profile' && (
  <div className="grid grid-cols-2 gap-5">

    {/* Editable shop details */}
    <JunkshopProfileEditor shop={shop} user={user} profile={profile} />

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
{viewRequest.household_avg_rating ? (
  <div className="flex items-center gap-1.5 mt-1">
    <span style={{ color:'#C97A3A', fontSize:'13px' }}>
      {'★'.repeat(Math.round(viewRequest.household_avg_rating))}
      {'☆'.repeat(5 - Math.round(viewRequest.household_avg_rating))}
    </span>
    <span className="text-xs text-gray-400">
      {viewRequest.household_avg_rating} avg · {viewRequest.household_rating_count} pickup{viewRequest.household_rating_count !== 1 ? 's' : ''}
    </span>
  </div>
) : (
  <p className="text-xs text-gray-300 mt-1">This household has no ratings yet</p>
)}
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
        onClick={() => { handleUpdateStatus(viewRequest.id, 'cancelled'); setViewRequest(null) }}
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

{confirmPickup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ backgroundColor:'rgba(0,0,0,0.4)' }}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
      <h3 className="text-sm font-medium text-gray-800 mb-1">Confirm pickup details</h3>
      <p className="text-xs text-gray-400 mb-5">Enter the actual weight and price paid to the household.</p>
      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Actual weight collected (kg)</label>
          <input type="number" min="0" step="0.1"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
            placeholder="e.g. 12.5"
            value={confirmForm.actual_weight_kg}
            onChange={e => setConfirmForm(p => ({ ...p, actual_weight_kg: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Final price paid to household (₱)</label>
          <input type="number" min="0" step="1"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
            placeholder="e.g. 200"
            value={confirmForm.final_price}
            onChange={e => setConfirmForm(p => ({ ...p, final_price: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
          <input type="text"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
            placeholder="e.g. Missing some bottles"
            value={confirmForm.completion_notes}
            onChange={e => setConfirmForm(p => ({ ...p, completion_notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setConfirmPickup(null)}
          className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
          Cancel
        </button>
        <button onClick={() => { setRatingHousehold(confirmPickup); setConfirmPickup(null) }}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor:'#1A4D35' }}>
          Next — rate household
        </button>
      </div>
    </div>
  </div>
)}

{ratingHousehold && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ backgroundColor:'rgba(0,0,0,0.4)' }}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
      {householdRatingDone ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm font-medium text-gray-700">Pickup marked complete!</p>
          <p className="text-xs text-gray-400 mt-1">Rating submitted</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-5">
            <h3 className="text-sm font-medium text-gray-800 mb-1">Rate this household</h3>
            <p className="text-xs text-gray-400">
              {ratingHousehold.household?.full_name || 'Household'} — were the items as described?
            </p>
          </div>
          <div className="flex justify-center gap-3 mb-6">
            {[1,2,3,4,5].map(star => (
              <button key={star}
                onClick={() => setHouseholdRatingScore(star)}
                style={{ fontSize:'32px', color: star <= householdRatingScore ? '#C97A3A' : '#E5E7EB', transition:'color 0.15s' }}>
                ★
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleCompleteAndRate(0)}
              className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
              Skip rating
            </button>
            <button onClick={() => handleCompleteAndRate(householdRatingScore)}
              disabled={!householdRatingScore}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: householdRatingScore ? '#1A4D35' : '#9CA3AF' }}>
              Mark done
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

    </DashboardLayout>
  )
}

function RequestCard({ req, onUpdate, showActions, showComplete, onView, onSetConfirm, cardStyle }) {
  const [offerPrice, setOfferPrice] = useState('')
  const [offering,   setOffering]   = useState(false)

  const s        = STATUS_STYLE[req.status] || STATUS_STYLE.requested
  const title = req.listings?.title || req.listing_title || ('Request from ' + (req.household?.full_name || 'Household'))
  const barangay = req.listings?.barangay        || req.barangay       || '—'
  const weight   = req.listings?.weight_estimate || req.weight         || req.est_weight_kg || null
  const name     = req.household?.full_name      || req.profiles?.full_name || 'Household'


  return (
    <div className="rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-md"
      style={{
        backgroundColor: '#C97A3A12',
        boxShadow: '0 2px 8px rgba(45,90,39,0.06)',
        ...cardStyle
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
        style={{ backgroundColor:'#D8F3DC', color:'#0D2B1F' }}>
        {name?.slice(0,2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-gray-800 truncate">{title}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          <span>{name}</span>
{req.household_avg_rating && (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
    style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
    ★ {req.household_avg_rating}
    <span className="opacity-60 ml-0.5">({req.household_rating_count})</span>
  </span>
)}
{!req.household_avg_rating && (
  <span className="text-xs text-gray-300">No ratings yet</span>
)}
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
  <button onClick={() => { onSetConfirm(req) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
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

function JunkshopProfileEditor({ shop, user, profile }) {
  const [form, setForm] = useState({
  shop_name:   '',
  phone:       '',
  barangay:    '',
  dti_number:  '',
  latitude:    null,
  longitude:   null,
  pickup_mode: 'both',
  min_pickup_kg: '',
})
  const [photoFile,    setPhotoFile]    = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  useEffect(() => {
  if (shop) {
    setForm({
  shop_name:    shop.shop_name    || '',
  phone:        shop.phone        || profile?.phone || '',
  barangay:     shop.barangay     || profile?.barangay || '',
  dti_number:   shop.dti_number   || '',
  latitude:     shop.latitude     || null,
  longitude:    shop.longitude    || null,
  pickup_mode:  shop.pickup_mode  || 'both',
  min_pickup_kg: shop.min_pickup_kg || '',
})
    setPhotoPreview(shop.photo_url || null)
  }
}, [shop, profile])

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
  shop_name:     form.shop_name,
  dti_number:    form.dti_number    || null,
  photo_url:     photoUrl,
  latitude:      form.latitude,
  longitude:     form.longitude,
  pickup_mode:   form.pickup_mode   || 'both',
  min_pickup_kg: form.min_pickup_kg ? parseFloat(form.min_pickup_kg) : null,
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

      <div>
  <label className="block text-xs font-medium text-gray-500 mb-2">Pickup mode</label>
  {[
    { value:'pickup',  label:'I do pickups (I go to the household)' },
    { value:'dropoff', label:'Drop-off only (household comes to me)' },
    { value:'both',    label:'Both' },
  ].map(opt => (
    <label key={opt.value} className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
      <input type="radio" name="pickup_mode" value={opt.value}
        checked={form.pickup_mode === opt.value}
        onChange={() => update('pickup_mode', opt.value)} />
      {opt.label}
    </label>
  ))}
</div>

<div>
  <label className="block text-xs font-medium text-gray-500 mb-1.5">
    Minimum pickup weight
    <span className="font-normal text-gray-300 ml-1">(leave blank if no minimum)</span>
  </label>
  <div className="flex items-center gap-2">
    <input
      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"
      type="number" min="0" placeholder="0"
      value={form.min_pickup_kg}
      onChange={e => update('min_pickup_kg', e.target.value)} />
    <span className="text-sm text-gray-400 shrink-0">kg minimum</span>
  </div>
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
    html: `<div style="background:#C97A3A;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5)"><div style="transform:rotate(45deg);color:#fff;font-size:11px;text-align:center;line-height:24px">♻</div></div>`,
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

function PickupCalendar({ pickups, role }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear]   = useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay    = new Date(currentYear, currentMonth, 1).getDay()

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const getPickupsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return pickups.filter(p =>
      p.preferred_date === dateStr ||
      p.scheduled_date === dateStr
    )
  }

  const STATUS_COLOR = {
    requested: '#FAEEDA',
    offered:   '#E6F1FB',
    accepted:  '#D8F3DC',
    completed: '#F3F4F6',
    cancelled: '#FAECE7',
  }
  const STATUS_TEXT = {
    requested: '#7A3F08',
    offered:   '#042C53',
    accepted:  '#085041',
    completed: '#6B7280',
    cancelled: '#993C1D',
  }

  const [selected, setSelected] = useState(null)
  const selectedPickups = selected ? getPickupsForDay(selected) : []

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
        style={{ boxShadow:'0 2px 12px rgba(45,90,39,0.08)' }}>

        {/* Month header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background:'linear-gradient(135deg, #1A4D35 0%, #0D2B1F 100%)' }}>
          <button onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/30 text-white hover:bg-white/20 transition duration-150"
            title="Previous month">
            ←
          </button>
          <span className="text-base font-semibold text-white">
            {monthNames[currentMonth]} <span className="text-green-200">{currentYear}</span>
          </span>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/30 text-white hover:bg-white/20 transition duration-150"
            title="Next month">
            →
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-100" style={{ backgroundColor:'#D8F3DC' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center py-2 text-xs font-bold text-green-900 tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-gray-100" style={{ backgroundColor:'#f9fafb' }} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1
            const dayPickups = getPickupsForDay(day)
            const isToday  = day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear  === today.getFullYear()
            const isSelected = selected === day

            return (
              <div key={day}
                onClick={() => setSelected(isSelected ? null : day)}
                className="h-20 border-b border-r border-gray-100 p-2 cursor-pointer transition duration-150 relative group"
                style={{
                  backgroundColor: isSelected ? '#D8F3DC' : isToday ? '#EAF3DE' : 'white',
                }}
                onMouseEnter={(e) => !isSelected && !isToday && (e.currentTarget.style.backgroundColor = '#f0f7ec')}
                onMouseLeave={(e) => !isSelected && !isToday && (e.currentTarget.style.backgroundColor = 'white')}>
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor:'#1A4D35' }} />
                )}
                <div className="flex items-center justify-start mb-1">
                  <span className="text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full transition-colors"
                    style={{
                      backgroundColor: isToday ? '#1A4D35' : 'transparent',
                      color:           isToday ? '#fff'    : '#6B7280',
                    }}>
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayPickups.slice(0,1).map((p, idx) => (
                    <div key={idx} className="text-xs px-1.5 py-0.5 rounded font-bold truncate transition-all"
                      style={{
                        backgroundColor: STATUS_COLOR[p.status] || '#F3F4F6',
                        color:           STATUS_TEXT[p.status]  || '#6B7280',
                        fontSize: '11px',
                      }}
                      title={role === 'household'
                        ? (p.junkshop?.shop_name || 'Junkshop')
                        : (p.household?.full_name || 'Household')}>
                      {role === 'household'
                        ? (p.junkshop?.shop_name || 'Junkshop')?.slice(0,8)
                        : (p.household?.full_name || 'Household')?.slice(0,8)}
                    </div>
                  ))}
                  {dayPickups.length > 1 && (
                    <div className="text-xs text-gray-600 font-bold px-1">
                      +{dayPickups.length - 1}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="mt-5">
          <div className="rounded-2xl p-4 mb-3 border border-gray-100"
            style={{ background:'linear-gradient(135deg, #D8F3DC 0%, #EAF3DE 100%)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-green-900">
                  📅 {monthNames[currentMonth]} {selected}
                </h3>
                <p className="text-xs text-green-700 mt-1 font-semibold">
                  {selectedPickups.length} pickup{selectedPickups.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-green-600 hover:text-green-800 text-xl transition font-bold">
                ✕
              </button>
            </div>
          </div>
          {selectedPickups.length > 0 ? (
            <div className="space-y-2">
              {selectedPickups.map((p, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition duration-150"
                  style={{ boxShadow:'0 2px 8px rgba(45,90,39,0.06)', borderLeft:`3px solid ${STATUS_COLOR[p.status] || '#F3F4F6'}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                    {role === 'household'
                      ? (p.junkshop?.shop_name || 'JS').slice(0,2).toUpperCase()
                      : (p.household?.full_name || 'HH').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800">
                      {role === 'household'
                        ? (p.junkshop?.shop_name || 'Junkshop')
                        : (p.household?.full_name || 'Household')}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.listings?.title || p.material_types?.join(', ') || 'Pickup'}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded font-bold shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: STATUS_COLOR[p.status] || '#F3F4F6',
                      color:           STATUS_TEXT[p.status]  || '#6B7280',
                    }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white border border-gray-100 rounded-xl text-sm text-gray-500 font-semibold">
              No pickups scheduled
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 rounded-2xl p-4 border border-gray-100"
        style={{ background:'linear-gradient(135deg, #E6F1FB 0%, #EAF3DE 100%)' }}>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">Legend</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(STATUS_COLOR).map(([status, bg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full shrink-0 border-2" style={{ backgroundColor: bg, borderColor:STATUS_TEXT[status] }} />
              <span className="text-xs text-gray-700 font-semibold capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}