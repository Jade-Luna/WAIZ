import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { key:'metal',      label:'Metal',      sub:'Scrap, pipes, cans'    },
  { key:'paper',      label:'Paper',      sub:'Cardboard, books'       },
  { key:'plastic',    label:'Plastic',    sub:'Bottles, containers'    },
  { key:'ewaste',     label:'E-waste',    sub:'Electronics, cables'    },
  { key:'glass',      label:'Glass',      sub:'Bottles, jars'          },
  { key:'secondhand', label:'Secondhand', sub:'Clothes, appliances'    },
  { key:'others',     label:'Others',     sub:'Mixed or uncategorized' },
]

const BARANGAYS = [
  'Abanao-Zandueta-Kayong-Chugum-Otek','Andres Bonifacio','Aurora Hill Proper',
  'Bayan Park','Burnham-Legarda','Cabinet Hill-Teacher\'s Camp','Camp 7','Camp 8',
  'Engineers Hill','Holy Ghost Extension','Holy Ghost Proper','Irisan',
  'Loakan Proper','Lualhati','Magsaysay Lower','Magsaysay Upper','Mines View Park',
  'New Lucban','Pacdal','Phil-Am','Pinsao Proper','Quirino Hill Proper',
  'Rock Quarry','San Antonio Village','San Roque Village','Session Road',
  'South Drive','Trancoville','Victoria Village',
]

export default function EditListing() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({
    title:'', description:'', category:'', weight_estimate:'', barangay:'',
    preferred_day:'', preferred_time:'', condition:'mixed',
  })
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newPhotoFiles,  setNewPhotoFiles]  = useState([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([])
  const [saving,   setSaving]   = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => { fetchListing() }, [id])

  const fetchListing = async () => {
    const { data } = await supabase
      .from('listings').select('*').eq('id', id).single()
    if (data) {
      setForm({
        title:           data.title           || '',
        description:     data.description     || '',
        category:        data.category        || '',
        weight_estimate: data.weight_estimate || '',
        barangay:        data.barangay        || '',
        preferred_day:   data.preferred_day   || '',
        preferred_time:  data.preferred_time  || '',
        condition:       data.condition       || 'mixed',
      })
      setExistingPhotos(data.photos || [])
    }
    setLoading(false)
  }

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files)
    const combined = [...newPhotoFiles, ...files].slice(0, 5 - existingPhotos.length)
    setNewPhotoFiles(combined)
    setNewPhotoPreviews(combined.map(f => URL.createObjectURL(f)))
  }

  const removeExistingPhoto = (i) => {
    setExistingPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

const handleSave = async () => {
  setSaving(true)
  setError('')

  const uploadedUrls = []
  for (const file of newPhotoFiles) {
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `listings/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('listing-photos').upload(path, file, { upsert: false })
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('listing-photos').getPublicUrl(uploadData.path)
      if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl)
    }
  }

  const allPhotos = [...existingPhotos, ...uploadedUrls]

  const updateData = {
    title:           form.title,
    description:     form.description,
    category:        form.category,
    weight_estimate: form.weight_estimate ? parseFloat(form.weight_estimate) : null,
    barangay:        form.barangay,
    preferred_day:   form.preferred_day,
    preferred_time:  form.preferred_time,
    condition:       form.condition,
    photos:          allPhotos,
  }

  console.log('Updating listing:', id, updateData)

  const { data, error: updateError } = await supabase
    .from('listings')
    .update(updateData)
    .eq('id', id)
    .select()

  console.log('Update result:', { data, updateError })

  setSaving(false)
  if (updateError) {
    setError(updateError.message)
    console.error('Update error details:', updateError)
  } else {
    navigate(`/listing/${id}`)
  }
}

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor:'#FEFDF8' }}>
      <div className="text-xl font-medium tracking-widest" style={{ color:'#1A4D35' }}>WAIZ</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor:'#FEFDF8' }}>
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color:'#0D2B1F' }}>
          WA<span style={{ color:'#C97A3A' }}>I</span>Z
        </Link>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
          ← Cancel
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color:'#2D6A4F' }}>
            Edit Listing
          </div>
          <h1 className="text-3xl font-medium text-gray-800">Update your listing</h1>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <div key={cat.key}
                  onClick={() => update('category', cat.key)}
                  className="rounded-xl p-2.5 text-center cursor-pointer border-2 transition"
                  style={{
                    borderColor:     form.category === cat.key ? '#1A4D35' : '#F3F4F6',
                    backgroundColor: form.category === cat.key ? '#D8F3DC' : '#fff',
                  }}>
                  <div className="text-xs font-medium text-gray-700">{cat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
            <input className={inputClass} placeholder="e.g. Assorted scrap metal pipes"
              value={form.title} onChange={e => update('title', e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea className={inputClass + ' resize-none'} rows={3}
              placeholder="Describe your items..."
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          {/* Weight + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Weight estimate (kg)
              </label>
              <input className={inputClass} type="number" min="0" step="0.5"
                placeholder="e.g. 10"
                value={form.weight_estimate} onChange={e => update('weight_estimate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Condition</label>
              <select className={inputClass}
                value={form.condition} onChange={e => update('condition', e.target.value)}>
                <option value="mixed">Mixed</option>
                <option value="good">Good</option>
                <option value="worn">Worn / Broken</option>
              </select>
            </div>
          </div>

          {/* Barangay */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Barangay</label>
            <select className={inputClass}
              value={form.barangay} onChange={e => update('barangay', e.target.value)}>
              <option value="">Select barangay...</option>
              {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Existing photos */}
          {existingPhotos.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Current photos</label>
              <div className="flex gap-2 flex-wrap">
                {existingPhotos.map((photo, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={photo} alt={`photo ${i+1}`}
                      className="w-full h-full object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => removeExistingPhoto(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new photos */}
          {existingPhotos.length < 5 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Add more photos <span className="font-normal text-gray-300">(up to {5 - existingPhotos.length} more)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {newPhotoPreviews.map((p, i) => (
                  <img key={i} src={p} alt={`new ${i+1}`}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition">
                  <span className="text-2xl text-gray-300">+</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={handleNewPhotos} />
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor:'#FAECE7', color:'#993C1D' }}>{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: saving ? '#52B788' : '#1A4D35' }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}