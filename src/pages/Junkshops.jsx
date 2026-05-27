import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'

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

const MATERIALS = ['All','Metal','Paper','Plastic','E-waste','Glass','Secondhand','Others']

const PRICE_FIELDS = [
  { key:'price_metal',      label:'Metal'      },
  { key:'price_paper',      label:'Paper'      },
  { key:'price_plastic',    label:'Plastic'    },
  { key:'price_ewaste',     label:'E-waste'    },
  { key:'price_glass',      label:'Glass'      },
  { key:'price_secondhand', label:'Secondhand' },
  { key:'price_others',     label:'Others'     }
]

function Stars({ rating }) {
  return (
    <span className="text-xs" style={{ color: '#C97A3A' }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      <span className="ml-1 text-gray-400">{rating}</span>
    </span>
  )
}

export default function Junkshops() {
  const { user, profile } = useAuth()
  const [shops, setShops]       = useState([])
  const [search, setSearch]     = useState('')
  const [barangay, setBarangay] = useState('All barangays')
  const [barangayInput,       setBarangayInput]       = useState('')
const [barangaySuggestions, setBarangaySuggestions] = useState([])
const [barangayOpen,        setBarangayOpen]        = useState(false)
  const [material, setMaterial] = useState('All')
  const [sortBy, setSortBy]     = useState('featured')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [requestShop, setRequestShop] = useState(null)
const [requesting,  setRequesting]  = useState(false)
const [requested,   setRequested]   = useState(false)
const [photoFiles,    setPhotoFiles]    = useState([])
const [photoPreviews, setPhotoPreviews] = useState([])


  useEffect(() => { fetchShops() }, [barangay, sortBy])

  const fetchShops = async () => {
  setLoading(true)
  let query = supabase
    .from('junkshops')
    .select('*, profiles(full_name, phone)')

  if (barangay !== 'All barangays') query = query.eq('barangay', barangay)
  if (sortBy === 'rating')   query = query.order('rating',        { ascending: false })
  if (sortBy === 'pickups')  query = query.order('total_pickups', { ascending: false })
  if (sortBy === 'featured') query = query.order('is_featured',   { ascending: false })

  const { data } = await query
  setShops(data || [])
  setLoading(false)
}

const handleRequest = async () => {
  if (!requestForm.material_types.length) return
  setRequesting(true)

  let photoUrls = []
  if (photoFiles.length > 0) {
    for (const file of photoFiles) {
      const ext  = file.name.split('.').pop()
      const path = `requests/${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(path, file, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
        photoUrls.push(data.publicUrl)
      }
    }
  }

  const { error: insertError } = await supabase.from('pickups').insert({
    junkshop_id:    requestShop.id,
    household_id:   user.id,
    material_types: requestForm.material_types,
    est_weight_kg:  requestForm.est_weight_kg ? parseFloat(requestForm.est_weight_kg) : null,
    preferred_date: requestForm.preferred_date || null,
    note:           requestForm.note || null,
    photos:         photoUrls.length > 0 ? photoUrls : null,
    status:         'requested',
  })

  setRequesting(false)
  setRequested(true)
  setTimeout(() => {
    setRequested(false)
    setRequestShop(null)
    setRequestForm({
      note:           '',
      material_types: [],
      preferred_date: '',
      preferred_time: '',
      est_weight_kg:  '',
    })
    setPhotoFiles([])
    setPhotoPreviews([])
    fetchShops()
  }, 2000)
}

const toggleMaterial = (m) => {
  setRequestForm(p => ({
    ...p,
    material_types: p.material_types.includes(m)
      ? p.material_types.filter(x => x !== m)
      : [...p.material_types, m]
  }))
}

const handlePhotoChange = (e) => {
  const newFiles = Array.from(e.target.files)
  setPhotoFiles(prev => {
    const combined = [...prev, ...newFiles].slice(0, 4)
    setPhotoPreviews(combined.map(f => URL.createObjectURL(f)))
    return combined
  })
}

const [requestForm, setRequestForm] = useState({
  note:           '',
  material_types: [],
  preferred_date: '',
  preferred_time: '',
  est_weight_kg:  '',
})


  const filtered = shops.filter(s => {
    const matchSearch   = s.shop_name.toLowerCase().includes(search.toLowerCase())
    const matchMaterial = material === 'All' || s[`price_${material.toLowerCase().replace('-','')}`] != null
    const matchBarangay = barangay === 'All barangays' || s.barangay === barangay
    return matchSearch && matchMaterial && matchBarangay
  })

  const featured = filtered.filter(s => s.is_featured)
  const regular  = filtered.filter(s => !s.is_featured)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFDF8' }}>

      {/* NAV */}
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: '#2D6A4F' }}>Junkshop Directory</div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-800">Registered junkshops in Baguio City</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Compare buying rates and find the best junkshop for your materials</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-300 rounded-2xl p-3 md:p-5 mb-6">
          <div className="flex gap-2 md:gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-2 md:px-3 py-2 flex-1 min-w-40">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M11 11l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                className="flex-1 text-xs md:text-sm outline-none bg-transparent placeholder-gray-300"
                placeholder="Search junkshops..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
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
            <select className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none"
              value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="featured">Featured first</option>
              <option value="rating">Highest rated</option>
              <option value="pickups">Most pickups</option>
            </select>
          </div>

          {/* Material filter pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {MATERIALS.map(m => (
              <button key={m}
                onClick={() => setMaterial(m)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  backgroundColor: material === m ? '#1A4D35' : '#F3F4F6',
                  color:           material === m ? '#fff'     : '#6B7280',
                }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-gray-400 mb-5">
          {loading ? 'Loading...' : `${filtered.length} junkshop${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-8">
            <div className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: '#C97A3A' }}>Featured</div>
            <div className="grid grid-cols-3 gap-5">
              {featured.map(shop => (
                <ShopCard key={shop.id} shop={shop} onSelect={setSelected} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && !loading && (
  <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
    <div className="text-5xl mb-4">🏪</div>
    <p className="text-base font-medium text-gray-500 mb-1">No junkshops registered yet</p>
    <p className="text-sm text-gray-400">
      Junkshops will appear here once they register on WAIZ
    </p>
  </div>
)}

        {/* All shops */}
        {regular.length === 0 && featured.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-sm">No junkshops found. Try a different filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {regular.map(shop => (
              <ShopCard key={shop.id} shop={shop} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: selected.avatarBg || '#D8F3DC', color: selected.avatarColor || '#0D2B1F' }}>
                  {selected.initials || selected.shop_name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{selected.shop_name}</div>
                  <Stars rating={selected.rating || 0} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Barangay</span>
                <span className="font-medium text-gray-700">{selected.barangay}</span>
              </div>
              <div className="flex justify-between">
                <span>Total pickups</span>
                <span className="font-medium text-gray-700">{selected.total_pickups || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified</span>
                <span className="font-medium" style={{ color: selected.is_verified ? '#1A4D35' : '#9CA3AF' }}>
                  {selected.is_verified ? '✓ Verified' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4 mb-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Buying Rates</div>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_FIELDS.map(f => selected[f.key] != null && (
                  <div key={f.key} className="flex justify-between text-sm">
                    <span className="text-gray-400">{f.label}</span>
                    <span className="font-medium" style={{ color: '#1A4D35' }}>₱{selected[f.key]}/kg</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
  to={`/junkshop/${selected.id}`}
  className="block w-full py-2.5 rounded-xl text-sm font-medium text-center mb-2 border"
  style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
  View full profile
</Link>

            {user && profile?.role === 'household' && (
              <button
    onClick={() => { setRequestShop(selected); setSelected(null) }}
    className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
    style={{ backgroundColor: '#C97A3A' }}>
    Request this junkshop for pickup
  </button>
            )}
            {!user && (
              <Link to="/signup"
                className="block w-full py-2.5 rounded-xl text-sm font-medium text-white text-center"
                style={{ backgroundColor: '#1A4D35' }}>
                Sign up to contact this junkshop
              </Link>
            )}
          </div>
        </div>
      )}
      
      {requestShop && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    onClick={() => setRequestShop(null)}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}>

      {requested ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-sm font-medium text-gray-800">Pickup requested!</p>
          <p className="text-xs text-gray-400 mt-1">
            {requestShop.shop_name} will review and contact you
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-medium text-gray-800">Request Pickup</h3>
              <p className="text-xs text-gray-400 mt-0.5">{requestShop.shop_name}</p>
            </div>
            <button onClick={() => setRequestShop(null)}
              className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
          </div>

          <div className="space-y-4">

            {/* Material types */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                What materials do you have? <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.filter(m => m !== 'All').map(m => (
  <button key={m}
    onClick={() => toggleMaterial(m)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition border"
                    style={{
                      backgroundColor: requestForm.material_types.includes(m) ? '#1A4D35' : '#F9FAFB',
                      color:           requestForm.material_types.includes(m) ? '#fff'     : '#6B7280',
                      borderColor:     requestForm.material_types.includes(m) ? '#1A4D35' : '#E5E7EB',
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated weight */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Estimated total weight (kg) <span className="text-gray-300 font-normal">— optional</span>
              </label>
              <input type="number" min="0" step="0.5"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
                placeholder="e.g. 5"
                value={requestForm.est_weight_kg}
                onChange={e => setRequestForm(p => ({ ...p, est_weight_kg: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">
                The junkshop will confirm the final price at pickup
              </p>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Photos of your recyclables <span className="text-gray-300 font-normal">— up to 4</span>
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-green-700 transition text-xs text-gray-400">
                <span>📷</span> Tap to add photos
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={handlePhotoChange} />
              </label>
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {photoPreviews.map((src, i) => (
                    <img key={i} src={src} alt=""
                      className="w-full aspect-square object-cover rounded-lg border border-gray-100" />
                  ))}
                </div>
              )}
            </div>

            {/* Preferred date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Preferred pickup date <span className="text-gray-300 font-normal">— optional</span>
              </label>
              <input type="date"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
                value={requestForm.preferred_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setRequestForm(p => ({ ...p, preferred_date: e.target.value }))}
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Additional note <span className="text-gray-300 font-normal">— optional</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 resize-none"
                rows={2}
                placeholder="Address, access instructions, best time to call..."
                value={requestForm.note}
                onChange={e => setRequestForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => setRequestShop(null)}
              className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
              Cancel
            </button>
            <button
              onClick={handleRequest}
              disabled={requesting || !requestForm.material_types.length}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
              style={{ backgroundColor: requesting || !requestForm.material_types.length ? '#9CA3AF' : '#C97A3A' }}>
              {requesting ? 'Sending...' : 'Send request'}
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

function ShopCard({ shop, onSelect }) {
  return (
    <div
      onClick={() => onSelect(shop)}
      className="bg-white rounded-2xl p-5 cursor-pointer hover:shadow-sm transition"
      style={{ border: shop.is_featured ? '2px solid #2D6A4F' : '1px solid #F3F4F6' }}>

      {shop.is_featured && (
        <span className="text-xs font-medium px-3 py-1 rounded-full inline-block mb-3"
          style={{ backgroundColor: '#D8F3DC', color: '#1A4D35' }}>
          Featured on WAIZ
        </span>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium shrink-0"
          style={{ backgroundColor: shop.avatarBg || '#D8F3DC', color: shop.avatarColor || '#0D2B1F' }}>
          {shop.initials || shop.shop_name?.slice(0,2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate">{shop.shop_name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Stars rating={shop.rating || 0} />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{shop.barangay}</div>
        </div>
        {shop.is_verified && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: '#D8F3DC', color: '#1A4D35' }}>✓</span>
        )}
      </div>

      <div className="border-t border-gray-300 pt-3 grid grid-cols-2 gap-y-1.5">
        {PRICE_FIELDS.map(f => shop[f.key] != null && (
          <div key={f.key} className="text-xs">
            <span className="text-gray-400">{f.label} </span>
            <span className="font-medium" style={{ color: '#1A4D35' }}>₱{shop[f.key]}/kg</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between items-center">
        <span className="text-xs text-gray-300">{shop.total_pickups || 0} pickups completed</span>
        <span className="text-xs font-medium" style={{ color: '#C97A3A' }}>View details →</span>
      </div>

    </div>
  )
}