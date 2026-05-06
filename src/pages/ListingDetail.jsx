import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'

const CAT_COLORS = {
  metal:      { bg:'#E1F5EE', color:'#085041' },
  paper:      { bg:'#EAF3DE', color:'#173404' },
  plastic:    { bg:'#E6F1FB', color:'#042C53' },
  ewaste:     { bg:'#FAEEDA', color:'#412402' },
  glass:      { bg:'#EEEDFE', color:'#26215C' },
  secondhand: { bg:'#FBEAF0', color:'#4B1528' },
  others:     { bg:'#F1EFE8', color:'#2C2C2A' },
}

const STATUS_STYLE = {
  available: { bg:'#D8F3DC', color:'#085041', label:'Available'     },
  pending:   { bg:'#FAEEDA', color:'#7A3F08', label:'Pending pickup' },
  completed: { bg:'#F3F4F6', color:'#6B7280', label:'Completed'     },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d    = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

export default function ListingDetail() {
  const { id }        = useParams()
  const { user, profile } = useAuth()
  const navigate      = useNavigate()
  const [listing,   setListing]   = useState(null)
  const [comments,  setComments]  = useState([])
  const [newComment,setNewComment]= useState('')
  const [posting,   setPosting]   = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [showPickupForm, setShowPickupForm] = useState(false)
  const [offeredPrice,   setOfferedPrice]   = useState('')
    const [pickupNote,     setPickupNote]     = useState('')
    const [submitting,     setSubmitting]     = useState(false)
const [pickupSent,     setPickupSent]     = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetchListing()
    fetchComments()

    const channel = supabase
      .channel(`comments-${id}`)
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'comments',
        filter:`listing_id=eq.${id}`,
      }, payload => {
        setComments(prev =>{
            const exists = prev.some(c => c.id === payload.new.id)
            return exists ? prev : [...prev, payload.new]
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

const fetchListing = async () => {
  const { data: listingData, error: listingError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (listingError) {
    console.error('Listing error:', listingError)
    setLoading(false)
    return
  }

  if (listingData?.posted_by) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, barangay, avatar_url')
      .eq('id', listingData.posted_by)
      .single()
    listingData.profiles = profileData
  }

  setListing(listingData)
  setLoading(false)
}

  const fetchComments = async () => {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('listing_id', id)
    .order('created_at', { ascending: true })

  if (!data) { setComments([]); return }

  const withProfiles = await Promise.all(data.map(async (comment) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', comment.user_id)
      .single()
    return { ...comment, profiles: profile }
  }))

  setComments(withProfiles)
}

  const handleComment = async () => {
  if (!newComment.trim() || !user || posting) return
  setPosting(true)
  const content = newComment.trim()
  setNewComment('')

  const { data } = await supabase.from('comments').insert({
    listing_id: id,
    user_id:    user.id,
    content,
  }).select('*, profiles(full_name, avatar_url)').single()

  if (data) {
    setComments(prev => {
      const exists = prev.some(c => c.id === data.id)
      return exists ? prev : [...prev, data]
    })
  }
  setPosting(false)
}

  const handleContact = () => {
    if (!user) { navigate('/login'); return }
    if (profile?.role === 'junkshop') {
      navigate(`/dashboard/junkshop?tab=messages&contact=${listing.posted_by}&listing=${id}&title=${encodeURIComponent(listing.title)}`)
    } else {
      navigate(`/dashboard/household?tab=messages`)
    }
  }

  const handlePickupRequest = async () => {
  if (!offeredPrice || !user) return
  setSubmitting(true)
  const { error } = await supabase.from('pickups').insert({
    listing_id:    listing.id,
    household_id:  listing.posted_by,
    junkshop_id:   user.id,
    offered_price: parseFloat(offeredPrice),
    status:        'requested',
  })
  console.log('Insert error:', error)
console.log('User ID:', user.id)
console.log('Listing posted_by:', listing.posted_by)

  if (!error) {
  await supabase.from('listings')
    .update({ status: 'pending' })
    .eq('id', listing.id)

  await supabase.from('messages').insert({
    sender_id:   user.id,
    receiver_id: listing.posted_by,
    content:     `Hi! I'd like to pick up your listing "${listing.title}". I'm offering ₱${offeredPrice}/kg.${pickupNote ? ' Note: ' + pickupNote : ''}`,
    is_read:     false,
  })
  setPickupSent(true)
  setShowPickupForm(false)
}
  setSubmitting(false)
}

 if (loading) return (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor:'#FEFDF8' }}>
    <div className="text-xl font-medium tracking-widest" style={{ color:'#1A4D35' }}>
      WA<span style={{ color:'#C97A3A' }}>I</span>Z
    </div>
  </div>
)

if (!listing) return (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor:'#FEFDF8' }}>
    <div className="text-center">
      <p className="text-gray-400 mb-4">Listing not found or still loading...</p>
      <Link to="/browse" className="text-sm" style={{ color:'#1A4D35' }}>← Back to browse</Link>
    </div>
  </div>
)

const cat    = CAT_COLORS[listing?.category]  || CAT_COLORS.others
const status = STATUS_STYLE[listing?.status]  || STATUS_STYLE.available
const photos = listing?.photos?.filter(Boolean) || []
  return (
    <div className="min-h-screen" style={{ backgroundColor:'#FEFDF8' }}>

      {/* NAV */}
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color:'#0D2B1F' }}>
          WA<span style={{ color:'#C97A3A' }}>I</span>Z
        </Link>
        <button onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="grid grid-cols-5 gap-8">

          {/* LEFT — Photos */}
          <div className="col-span-3">

            {/* Main photo */}
            <div className="rounded-2xl overflow-hidden mb-3 border border-gray-100"
              style={{ height:'380px', backgroundColor: cat.bg }}>
              {photos.length > 0 ? (
                <img src={photos[activeImg]} alt={listing.title}
                  className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-medium"
                    style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                    {listing.category?.slice(0,2).toUpperCase()}
                  </div>
                  <p className="text-sm" style={{ color: cat.color }}>No photo uploaded</p>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 mb-5">
                {photos.map((photo, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className="w-16 h-16 rounded-xl overflow-hidden border-2 transition"
                    style={{ borderColor: activeImg === i ? '#1A4D35' : 'transparent' }}>
                    <img src={photo} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* COMMENTS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Comments {comments.length > 0 && `(${comments.length})`}
              </h3>

              {comments.length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">
                  No comments yet — be the first to ask about this item
                </p>
              )}

              <div className="space-y-3 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
                      style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                      {c.profiles?.full_name?.slice(0,2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-700">
                          {c.profiles?.full_name || 'User'}
                        </span>
                        <span className="text-xs text-gray-300">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
                    placeholder="Ask about this item..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                  />
                  <button onClick={handleComment} disabled={posting || !newComment.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition shrink-0"
                    style={{ backgroundColor: newComment.trim() ? '#1A4D35' : '#D1FAE5' }}>
                    Post
                  </button>
                </div>
              ) : (
                <Link to="/login"
                  className="block text-center text-sm py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
                  Log in to comment
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT — Details */}
          <div className="col-span-2">

            {/* Status + category */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: cat.bg, color: cat.color }}>
                {listing.category}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-medium text-gray-800 mb-2">{listing.title}</h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
              {listing.weight_estimate && <span>~{listing.weight_estimate} kg</span>}
              {listing.weight_estimate && <span>·</span>}
              <span>📍 {listing.profiles?.barangay || listing.barangay}</span>
              <span>·</span>
              <span>{timeAgo(listing.created_at)}</span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-400 mb-2">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Posted by */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
              <p className="text-xs font-medium text-gray-400 mb-3">Posted by</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden"
                  style={{ backgroundColor:'#D8F3DC' }}>
                  {listing.profiles?.avatar_url ? (
                    <img src={listing.profiles.avatar_url}
                      className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-medium"
                      style={{ color:'#1A4D35' }}>
                      {listing.profiles?.full_name?.slice(0,2).toUpperCase() || 'HH'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {listing.profiles?.full_name || 'Household'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {listing.profiles?.barangay || 'Baguio City'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {user && profile?.role === 'junkshop' && listing.status === 'available' && (
  <>
    <button onClick={handleContact}
      className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
      style={{ backgroundColor:'#1A4D35' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Message household
    </button>

    {pickupSent ? (
      <div className="w-full py-3 rounded-xl text-sm font-medium text-center"
        style={{ backgroundColor:'#D8F3DC', color:'#085041' }}>
        ✓ Pickup request sent! Check your dashboard.
      </div>
    ) : showPickupForm ? (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Send a pickup request</p>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Your offered price (₱ per kg)
          </label>
          <input type="number" min="0" step="0.5"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700"
            placeholder="e.g. 14"
            value={offeredPrice}
            onChange={e => setOfferedPrice(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Note <span className="font-normal text-gray-300">(optional)</span>
          </label>
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 resize-none"
            rows={2} placeholder="e.g. Available Monday morning..."
            value={pickupNote}
            onChange={e => setPickupNote(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPickupForm(false)}
            className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
            Cancel
          </button>
          <button onClick={handlePickupRequest}
            disabled={!offeredPrice || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: offeredPrice ? '#C97A3A' : '#D1FAE5' }}>
            {submitting ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </div>
    ) : (
      <button onClick={() => setShowPickupForm(true)}
        className="w-full py-3 rounded-xl text-sm font-medium"
        style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
        Request pickup
      </button>
    )}
  </>
)}
            {/* Pickup preference */}
            {(listing.preferred_day || listing.preferred_time) && (
              <div className="mt-4 p-4 rounded-xl text-xs"
                style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                <p className="font-medium mb-1">Preferred pickup</p>
                <p>{listing.preferred_day || 'Any day'} · {listing.preferred_time || 'Any time'}</p>
              </div>
            )}

            {/* Report listing */}
            {user && user.id !== listing.posted_by && (
              <ReportButton listingId={listing.id} userId={user.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
function ReportButton({ listingId, userId }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const REASONS = [
    'Fake or misleading listing',
    'Inappropriate content',
    'Spam or duplicate',
    'Wrong category',
    'Other',
  ]

  const handleReport = async () => {
    if (!reason) return
    setSubmitting(true)
    await supabase.from('reports').insert({
      listing_id:  listingId,
      reported_by: userId,
      reason,
    })
    setSubmitting(false)
    setSent(true)
    setOpen(false)
  }

  if (sent) return (
    <div className="mt-3 p-3 rounded-xl text-xs text-center"
      style={{ backgroundColor:'#FAEEDA', color:'#7A3F08' }}>
      ✓ Report submitted. Our team will review this listing.
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full mt-3 py-2 rounded-xl text-xs text-gray-400 border border-gray-100 hover:border-red-200 hover:text-red-400 transition">
        🚩 Report this listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-medium text-gray-800 mb-1">Report this listing</h3>
            <p className="text-xs text-gray-400 mb-4">
              Help keep WAIZ safe. Select a reason below.
            </p>
            <div className="space-y-2 mb-5">
              {REASONS.map(r => (
                <button key={r}
                  onClick={() => setReason(r)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm border transition"
                  style={{
                    borderColor:     reason === r ? '#1A4D35' : '#F3F4F6',
                    backgroundColor: reason === r ? '#D8F3DC' : '#fff',
                    color:           reason === r ? '#1A4D35' : '#6B7280',
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
                Cancel
              </button>
              <button onClick={handleReport}
                disabled={!reason || submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: reason ? '#DC2626' : '#D1FAE5' }}>
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}