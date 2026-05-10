import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'


function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })
}

export default function Messages() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState([])
const [userSearch,        setUserSearch]        = useState('')
const [userSearchResults, setUserSearchResults] = useState([])
const [searchLoading,     setSearchLoading]     = useState(false)
  const [activeConv,    setActiveConv]    = useState(null)
  const [messages,      setMessages]      = useState([])
  const [newMsg,        setNewMsg]        = useState('')
  const [sending,       setSending]       = useState(false)
  const [loading,       setLoading]       = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv)
      subscribeToMessages(activeConv)
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  const fetchConversations = async () => {
  const contactId    = searchParams.get('contact')
  const listingTitle = searchParams.get('title')
  const listingId    = searchParams.get('listing')
  const listingImage = searchParams.get('image')
  const listingWeight = searchParams.get('weight')
  const listingCategory = searchParams.get('category')

  if (contactId) {
    setActiveConv(contactId)
    if (listingTitle && listingId) {
      const listingUrl = `${window.location.origin}/listing/${listingId}`
      const cardContent = JSON.stringify({
        type:     'listing_card',
        title:    decodeURIComponent(listingTitle),
        image:    listingImage ? decodeURIComponent(listingImage) : null,
        weight: listingWeight ? `${listingWeight}` : null,
        category: listingCategory || null,
        url:      listingUrl,
        text:     "Hi! I'm interested in this listing.",
      })

      // Check if this card was already sent to avoid duplicates on re-render
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', user.id)
        .eq('receiver_id', contactId)
        .eq('content', cardContent)
        .limit(1)

      if (!existing || existing.length === 0) {
        const msgObj = {
          sender_id:   user.id,
          receiver_id: contactId,
          content:     cardContent,
          is_read:     false,
        }
        setMessages(prev => [...prev, {
          ...msgObj,
          id:         Date.now(),
          created_at: new Date().toISOString(),
        }])
        await supabase.from('messages').insert(msgObj)
      }
    }
  }

  const { data } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, role), receiver:profiles!receiver_id(full_name, role)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) { setConversations([]); return }

  const convMap = {}
  data.forEach(msg => {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
    const other   = msg.sender_id === user.id ? msg.receiver   : msg.sender
    if (!convMap[otherId]) {
      convMap[otherId] = {
        id:             otherId,
        other_id:       otherId,
        other_name:     other?.full_name || 'Unknown',
        other_initials: (other?.full_name || 'UN').slice(0,2).toUpperCase(),
        other_role:     other?.role,
        last_message:   msg.content,
        last_time:      formatTime(msg.created_at),
        unread:         (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0,
        avatarBg:       '#D8F3DC',
        avatarColor:    '#0D2B1F',
      }
    }
  })
  const convList = Object.values(convMap)
  if (convList.length > 0) setConversations(convList)
}

const handleUserSearch = async (query) => {
  if (query.length < 1) { setUserSearchResults([]); return }
  setSearchLoading(true)
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, barangay')
    .neq('id', user.id)
    .ilike('full_name', `%${query}%`)
    .limit(5)
  setUserSearchResults(data || [])
  setSearchLoading(false)
}

const startNewConversation = (otherUser) => {
  setActiveConv(otherUser.id)
  setUserSearch('')
  setUserSearchResults([])
  setConversations(prev => {
    const exists = prev.find(c => c.id === otherUser.id || c.other_id === otherUser.id)
    if (exists) return prev
    return [{
      id:             otherUser.id,
      other_id:       otherUser.id,
      other_name:     otherUser.full_name,
      other_initials: otherUser.full_name?.slice(0,2).toUpperCase() || 'U',
      other_role:     otherUser.role,
      last_message:   'Start a conversation...',
      last_time:      '',
      unread:         0,
      avatarBg:       '#D8F3DC',
      avatarColor:    '#0D2B1F',
    }, ...prev]
  })
}

  const fetchMessages = async (otherId) => {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setMessages(data)
      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherId)
    } else {
      setMessages([])
    }
    setLoading(false)
  }

  const subscribeToMessages = (otherId) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`messages-${user.id}-${otherId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, payload => {
        if (payload.new.sender_id === otherId) {
          setMessages(prev => [...prev, payload.new])
        }
      })
      .subscribe()

    channelRef.current = channel
  }

  const handleSend = async () => {
  if (!newMsg.trim() || !activeConv || sending) return
  if (activeConv === user.id) return  // ✅ add this line
  setSending(true)

    const msgObj = {
      sender_id:   user.id,
      receiver_id: activeConv,
      content:     newMsg.trim(),
      is_read:     false,
    }

    // Optimistic update
    setMessages(prev => [...prev, {
      ...msgObj,
      id:         Date.now(),
      created_at: new Date().toISOString(),
    }])
    setNewMsg('')

    await supabase.from('messages').insert(msgObj)
    setSending(false)
  }

  const activeConvData = conversations.find(c =>
    c.id === activeConv || c.other_id === activeConv
  )

  return (
  <div>
    <div className="mb-5">
      <h2 className="text-base font-medium text-gray-700">Messages</h2>
      <p className="text-sm text-gray-400 mt-0.5">
        Chat directly with {profile?.role === 'junkshop' ? 'households' : 'junkshops'}
      </p>
    </div>

    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
  style={{ height:'560px', display:'flex', position:'relative' }}>      

      {/* Sidebar */}
     <div className="border-r border-gray-100 flex flex-col transition-all duration-150"
  style={{ width: sidebarOpen ? '288px' : '52px', minWidth: sidebarOpen ? '288px' : '52px', overflow: 'hidden' }}>

  <div className="flex items-center border-b border-gray-50"
    style={{ minHeight:'52px', padding:'8px' }}>
    {sidebarOpen && (
      <div className="flex-1 space-y-2 mr-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.3"/>
            <path d="M11 11l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
            placeholder="Search or start new chat..."
            value={userSearch}
            onChange={e => {
              setUserSearch(e.target.value)
              handleUserSearch(e.target.value)
            }}
          />
        </div>
        {userSearchResults.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            {userSearchResults.map(u => (
              <div key={u.id}
                onClick={() => startNewConversation(u)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-50 transition">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium shrink-0"
                  style={{ backgroundColor:'#D8F3DC', color:'#1A4D35' }}>
                  {(u.full_name || 'U').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{u.full_name}</p>
                  <p className="text-xs text-gray-400">{u.role} · {u.barangay}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

  </div>

  {sidebarOpen && (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-xs text-gray-400">No conversations yet</p>
        </div>
      ) : (
        conversations.map(conv => (
          <div key={conv.id}
            onClick={() => setActiveConv(conv.other_id || conv.id)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition"
            style={{
              backgroundColor: activeConv === conv.other_id || activeConv === conv.id
                ? '#F0FDF4' : 'transparent'
            }}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: conv.avatarBg, color: conv.avatarColor }}>
                {conv.other_initials}
              </div>
              {conv.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor:'#C97A3A', fontSize:'9px' }}>
                  {conv.unread}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {conv.other_name}
                </span>
                <span className="text-xs text-gray-300 shrink-0 ml-2">
                  {conv.last_time}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {(() => {
                  try {
                    const parsed = JSON.parse(conv.last_message)
                    if (parsed.type === 'listing_card') return `📦 ${parsed.title}`
                  } catch {}
                  return conv.last_message
                })()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )}
</div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(p => !p)}
        style={{
          position:'absolute',
          left: sidebarOpen ? '276px' : '40px',
          top:'8px',
          width:'24px', height:'24px',
          borderRadius:'50%',
          border:'none', cursor:'pointer',
          backgroundColor:'#1A4D35', color:'#fff',
          fontSize:'10px', zIndex:10,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'left 0.15s',
          boxShadow:'0 2px 6px rgba(0,0,0,0.2)'
        }}>
        {sidebarOpen ? '◀' : '▶'}
      </button>


      {/* Chat window */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-medium shrink-0"
              style={{ backgroundColor: activeConvData?.avatarBg || '#D8F3DC', color: activeConvData?.avatarColor || '#0D2B1F' }}>
              {activeConvData?.other_initials || '??'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">
                {activeConvData?.other_name || 'Conversation'}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
            style={{ backgroundColor:'#F9FDF7' }}>
            {loading ? (
              <div className="text-center text-xs text-gray-300 py-8">Loading messages...</div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id || msg.sender_id === 'me'
                return (
                  <div key={msg.id || i}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs">
                      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{
                          backgroundColor: isMe ? '#1A4D35' : '#fff',
                          color:           isMe ? '#fff'    : '#374151',
                          borderRadius:    isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          border: isMe ? 'none' : '1px solid #F3F4F6',
                        }}>
                        {(() => {
                          try {
                            const parsed = JSON.parse(msg.content)
                            if (parsed.type === 'listing_card') {
                              return (
                                <div style={{
                                  borderRadius: '12px', overflow: 'hidden',
                                  border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E5E7EB',
                                  minWidth: '200px', maxWidth: '240px',
                                }}>
                                  {parsed.image && (
                                    <img src={parsed.image} alt={parsed.title}
                                      style={{ width:'100%', height:'120px', objectFit:'cover', display:'block' }} />
                                  )}
                                  <div style={{ padding:'8px 10px', backgroundColor: isMe ? 'rgba(255,255,255,0.08)' : '#F9FAFB' }}>
                                    <p style={{ fontSize:'12px', fontWeight:600, margin:'0 0 2px', color: isMe ? '#fff' : '#111827' }}>
                                      {parsed.title}
                                    </p>
                                    <p style={{ fontSize:'11px', margin:'0 0 6px', color: isMe ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>
                                      {parsed.category}{parsed.weight ? ` · ${parsed.weight}kg` : ''}
                                    </p>
                                    <p style={{ fontSize:'11px', margin:'0 0 8px', color: isMe ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                                      {parsed.text}
                                    </p>
                                    <a href={parsed.url} target="_blank" rel="noreferrer"
                                      style={{
                                        display:'block', textAlign:'center', fontSize:'11px',
                                        padding:'5px 10px', borderRadius:'8px', textDecoration:'none',
                                        backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : '#1A4D35',
                                        color:'#fff',
                                      }}>
                                      View listing →
                                    </a>
                                  </div>
                                </div>
                              )
                            }
                          } catch {}
                          return msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                            /^https?:\/\//.test(part)
                              ? <a key={i} href={part} target="_blank" rel="noreferrer"
                                  style={{ color: isMe ? '#86EFAC' : '#1A4D35', textDecoration:'underline', wordBreak:'break-all' }}>
                                  {part}
                                </a>
                              : part
                          )
                        })()}
                      </div>
                      <div className={`text-xs text-gray-300 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3 bg-white">
            <input
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"
              placeholder="Type a message..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!newMsg.trim() || sending}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 transition"
              style={{ backgroundColor: newMsg.trim() ? '#1A4D35' : '#D1FAE5' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3"
          style={{ backgroundColor:'#F9FDF7' }}>
          <div className="text-4xl">💬</div>
          <p className="text-sm font-medium text-gray-500">Select a conversation</p>
          <p className="text-xs text-gray-400">Choose a conversation from the left to start chatting</p>
        </div>
      )}
    </div>
  </div>
)
}