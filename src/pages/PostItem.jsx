import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'
import { Wrench, FileText, FlaskConical, MonitorSmartphone, GlassWater, Shirt, MoreHorizontal } from 'lucide-react'

const CATEGORIES = [
  { key:'metal',      label:'Metal',      sub:'Scrap, pipes, cans',       bg:'#E1F5EE', iconBg:'#B7E4C7', color:'#085041', icon:<Wrench size={18} /> },
  { key:'paper',      label:'Paper',      sub:'Cardboard, books',          bg:'#EAF3DE', iconBg:'#C0DD97', color:'#173404', icon:<FileText size={18} /> },
  { key:'plastic',    label:'Plastic',    sub:'Bottles, containers',       bg:'#E6F1FB', iconBg:'#B5D4F4', color:'#042C53', icon:<FlaskConical size={18} /> },
  { key:'ewaste',     label:'E-waste',    sub:'Electronics, cables',       bg:'#FAEEDA', iconBg:'#FAC775', color:'#412402', icon:<MonitorSmartphone size={18} /> },
  { key:'glass',      label:'Glass',      sub:'Bottles, jars',             bg:'#EEEDFE', iconBg:'#CECBF6', color:'#26215C', icon:<GlassWater size={18} /> },
  { key:'secondhand', label:'Secondhand', sub:'Clothes, appliances',       bg:'#FBEAF0', iconBg:'#F4C0D1', color:'#4B1528', icon:<Shirt size={18} /> },
  { key:'others',     label:'Others',     sub:'Mixed or uncategorized',    bg:'#F1EFE8', iconBg:'#D3D1C7', color:'#2C2C2A', icon:<MoreHorizontal size={18} /> },
]

const BARANGAYS = [
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

const CONDITIONS = [
  { key:'mixed',    label:'Mixed',         desc:'Assorted items of varying condition' },
  { key:'good',     label:'Good',          desc:'Items are intact and usable' },
  { key:'worn',     label:'Worn / Broken', desc:'Items are damaged but recyclable' },
]

const STEPS = ['Category','Details','Location','Review']

export default function PostItem() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]           = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [photoPreviewList, setPhotoPreviewList] = useState([])
  const [photoFileList, setPhotoFileList] = useState([])

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    weight_estimate: '',
    condition: 'mixed',
    barangay: profile?.barangay || '',
    address_note: '',
    preferred_day: '',
    preferred_time: '',
  })

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handlePhotoMultiple = (e) => {
  const files   = Array.from(e.target.files)
  const newFiles = [...(photoFileList ?? []), ...files].slice(0, 5)
  setPhotoFileList(newFiles)
  setPhotoPreviewList(newFiles.map(f => URL.createObjectURL(f)))
}

const removePhoto = (i) => {
  setPhotoFileList(prev  => prev.filter((_,idx)  => idx !== i))
  setPhotoPreviewList(prev => prev.filter((_,idx) => idx !== i))
}



const handleSubmit = async () => {
    
    setError('')
    setLoading(true)

    console.log('Photo files to upload:', photoFileList.length)
console.log('User ID:', user?.id)

    let photoUrl = null

    
const photoUrls = []
for (const file of photoFileList) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const path = `listings/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('listing-photos')
    .upload(path, file, { cacheControl:'3600', upsert: false })
  if (!uploadError && uploadData) {
    const { data: urlData } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(uploadData.path)
    if (urlData?.publicUrl) photoUrls.push(urlData.publicUrl)
  } else {
    console.error('Upload error:', uploadError)
  }
}
 

    const { error: insertError } = await supabase.from('listings').insert({
      posted_by:       user.id,
      title:           form.title,
      description:     form.description,
      category:        form.category,
      weight_estimate: form.weight_estimate ? parseFloat(form.weight_estimate) : null,
      barangay:        form.barangay,
      photos:          photoUrls,
      status:          'available',
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      navigate('/dashboard/household')
    }
    
  }

  const canNext = () => {
  if (step === 0) return form.category !== ''
  if (step === 1) return form.title.trim().length >= 3
  if (step === 2) return form.barangay !== ''
  return true
}

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFDF8' }}>

      {/* NAV */}
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color: '#0D2B1F' }}>
          WA<span style={{ color: '#C97A3A' }}>I</span>Z
        </Link>
        <Link to="/dashboard/household" className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: '#2D6A4F' }}>
            Post an Item
          </div>
          <h1 className="text-3xl font-medium text-gray-800">What are you recycling?</h1>
          <p className="text-sm text-gray-400 mt-1">
            Fill in the details and verified junkshops near you will send pickup requests.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                  style={{
                    backgroundColor: step === i ? '#C97A3A' : step > i ? '#1A4D35' : '#F3F4F6',
                    color: step >= i ? '#fff' : '#9CA3AF'
                  }}>
                  {step > i ? '✓' : i + 1}
                </div>
                <span className="text-xs hidden sm:block"
                  style={{ color: step === i ? '#1A4D35' : '#9CA3AF', fontWeight: step === i ? 500 : 400 }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1" style={{ backgroundColor: step > i ? '#1A4D35' : '#E5E7EB' }} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">

          {/* STEP 0 — Category */}
          {step === 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-4">Select the category that best matches your item</p>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <div key={cat.key}
                    onClick={() => update('category', cat.key)}
                    className="rounded-2xl p-4 text-center cursor-pointer border-2 transition"
                    style={{
                      backgroundColor: form.category === cat.key ? cat.bg      : '#fff',
                      borderColor:     form.category === cat.key ? '#1A4D35'   : '#F3F4F6',
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
  style={{ backgroundColor: cat.iconBg, color: cat.color }}>
  {cat.icon}
</div>
                    <div className="text-sm font-medium text-gray-700">{cat.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{cat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 — Item details */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Tell junkshops about your item</p>

              {/* Multiple photo upload */}
<div>
  <label className="block text-xs font-medium text-gray-500 mb-2">
    Photos <span className="font-normal text-gray-400">(up to 5 photos — optional but recommended)</span>
  </label>
  <div className="grid grid-cols-5 gap-2 mb-2">
    {photoPreviewList.map((preview, i) => (
      <div key={i} className="relative aspect-square">
        <img src={preview} alt={`Photo ${i+1}`}
          className="w-full h-full object-cover rounded-xl border border-gray-200" />
        <button
          onClick={() => removePhoto(i)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          ✕
        </button>
      </div>
    ))}
    {photoPreviewList.length < 5 && (
      <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#9CA3AF" strokeWidth="1.3"/>
          <line x1="12" y1="8" x2="12" y2="16" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="8" y1="12" x2="16" y2="12" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-gray-300 mt-1">Add</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoMultiple} />
      </label>
    )}
  </div>
</div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Item title</label>
                <input className={inputClass}
                  placeholder="e.g. Assorted scrap metal pipes"
                  value={form.title}
                  onChange={e => update('title', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Be specific — good titles get more pickup requests</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea className={inputClass + ' resize-none'} rows={3}
                  placeholder="Describe your items — quantity, condition, any details junkshops should know..."
                  value={form.description}
                  onChange={e => update('description', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Estimated weight (kg) <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input className={inputClass} type="number" min="0" step="0.5"
                    placeholder="e.g. 10"
                    value={form.weight_estimate}
                    onChange={e => update('weight_estimate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Condition</label>
                  <select className={inputClass}
                    value={form.condition}
                    onChange={e => update('condition', e.target.value)}>
                    {CONDITIONS.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Where should the junkshop pick up?</p>

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
                  Street / landmark <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input className={inputClass}
                  placeholder="e.g. Near SM City Baguio, along Session Road"
                  value={form.address_note}
                  onChange={e => update('address_note', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">
                  Your exact address is only shared with the junkshop you accept.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Preferred pickup day <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <select className={inputClass}
                    value={form.preferred_day}
                    onChange={e => update('preferred_day', e.target.value)}>
                    <option value="">Any day</option>
                    <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
                    <option>Thursday</option><option>Friday</option><option>Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Preferred time <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <select className={inputClass}
                    value={form.preferred_time}
                    onChange={e => update('preferred_time', e.target.value)}>
                    <option value="">Any time</option>
                    <option>Morning (6am–12pm)</option>
                    <option>Afternoon (12pm–6pm)</option>
                  </select>
                </div>
              </div>

              {/* Privacy note */}
              <div className="rounded-xl p-4 text-xs leading-relaxed"
                style={{ backgroundColor: '#D8F3DC', color: '#1A4D35' }}>
                Your full address is never shown publicly. Junkshops only see your barangay until you accept their pickup request.
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-4">Review your listing before posting</p>

              {photoPreviewList.length > 0 && (
  <div className="grid grid-cols-3 gap-2 mb-4">
    {photoPreviewList.map((p, i) => (
      <img key={i} src={p} alt={`preview ${i+1}`}
        className="w-full h-24 object-cover rounded-xl border border-gray-100" />
    ))}
  </div>
)}

              <div className="space-y-3">
                {[
                  { label:'Category',    value: CATEGORIES.find(c => c.key === form.category)?.label },
                  { label:'Title',       value: form.title },
                  { label:'Description', value: form.description },
                  { label:'Weight',      value: form.weight_estimate ? `~${form.weight_estimate} kg` : 'Not specified' },
                  { label:'Condition',   value: CONDITIONS.find(c => c.key === form.condition)?.label },
                  { label:'Barangay',    value: form.barangay },
                  { label:'Location note', value: form.address_note || 'Not specified' },
                  { label:'Pickup preference', value: form.preferred_day && form.preferred_time
                      ? `${form.preferred_day}, ${form.preferred_time}`
                      : form.preferred_day || form.preferred_time || 'Any time' },
                ].map(row => (
                  <div key={row.label} className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 w-32 shrink-0">{row.label}</span>
                    <span className="text-sm text-gray-700">{row.value}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}>
                  {error}
                </div>
              )}

              <div className="mt-4 rounded-xl p-4 text-xs leading-relaxed"
                style={{ backgroundColor: '#FAEEDA', color: '#7A3F08' }}>
                Once posted, your listing is visible to all registered junkshops in Baguio City. You can edit or remove it anytime from your dashboard.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
  <button
    onClick={() => {
      if (canNext()) setStep(s => s + 1)
    }}
    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
    style={{
      backgroundColor: canNext() ? '#1A4D35' : '#9CA3AF',
      cursor: canNext() ? 'pointer' : 'not-allowed'
    }}>
    Continue
  </button>
) : (
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
    style={{ backgroundColor: loading ? '#52B788' : '#C97A3A' }}>
    {loading ? 'Posting...' : "Post listing"}
  </button>
)}
          </div>
        </div>

        {/* Help note */}
        <p className="text-xs text-center text-gray-400 mt-4">
          Need help? Contact us at{' '}
          <span style={{ color: '#1A4D35' }}>support@waiz.p<a href="mailto:supportwaiz@gmail.com" style={{ color:'#1A4D35' }}>support@waiz.ph</a>h</span>
        </p>
      </div>
    </div>
  )
}