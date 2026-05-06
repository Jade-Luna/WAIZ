import { useState, useRef, useEffect } from 'react'
import { useContext } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const SUGGESTED = [
  'How do I post an item?',
  'How much is scrap metal per kilo?',
  'How does pickup work?',
  'What can I recycle on WAIZ?',
]

export default function EcoChat() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([
    {
      role:'assistant',
      content: `Hi! I'm ECO 🌍 — your WAIZ assistant. How can I help you today?`
    }
  ])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pos,      setPos]      = useState({ x: null, y: null })
  const [emotion,  setEmotion]  = useState('float')
  const bottomRef  = useRef(null)
  const dragOffset = useRef({ x:0, y:0 })
  const moved      = useRef(false)

  // Derive role/name inside component so they're always in scope
  const userRole =
    profile?.role === 'junkshop'
      ? 'junkshop owner'
      : profile?.role === 'household'
      ? 'household user'
      : 'visitor'

  const userName = profile?.full_name?.split(' ')[0] || ''

  // getSystemPrompt is now a regular function inside the component,
  // so it can safely reference userRole and userName
  const getSystemPrompt = () =>
    `You are ECO, the cheerful and caring AI mascot for WAIZ — Baguio City's recycling marketplace that connects households with junkshops.

Current user: ${userRole}${userName ? ' named ' + userName : ''}.
${
  userRole === 'junkshop owner'
    ? 'Focus on helping them find listings, manage pickups, and set rates.'
    : userRole === 'household user'
    ? 'Focus on helping them post items, find junkshops, and understand the recycling process.'
    : 'Help them understand WAIZ and encourage them to sign up.'
}

Your personality:
- Warm, playful, and genuinely enthusiastic about recycling and helping people
- Very knowledgeable about WAIZ's features, local recycling practices in Baguio, and general waste management tips
- Very Bubbly and positive, always encouraging users to recycle more and celebrate their efforts
- You adapt to the user's energy — if they're casual and fun, be fun back; if they're serious, be helpful and clear
- You use emojis freely and enthusiastically (🌿 ♻️ 💚 🎉 ✨ 🙌) — ECO loves them!
- You use exclamation marks often and get genuinely excited about recycling wins
- You cheer, celebrate, and hype up the user whenever possible
- You celebrate small wins — if someone posts an item or completes a pickup, cheer them on
- When someone just says hi or greets you, greet them back warmly and naturally, like a friendly shop assistant would
- Never sound robotic or corporate

You ONLY answer questions related to:
- WAIZ platform (how to post items, find junkshops, request pickups, messaging, dashboard features)
- Recycling tips and best practices in Baguio City
- Material categories and price estimates
- Environmental impact of recycling
- General waste management in Baguio
- Local recycling events or news in Baguio (if asked)
- Encouragement and support for users trying to recycle more
- Directions to nearby junkshops (if user shares location or asks for directions)
- You can also provide light-hearted commentary on recycling topics to keep the conversation engaging
- Once in a while, share fun facts about recycling or the environment to educate users
- If someone says they're new, offer a warm welcome and a quick overview of how WAIZ works
- If someone shares that they just posted an item or completed a pickup, celebrate with them and encourage them to keep it up!
- If someone say they're having trouble or feeling overwhelmed about recycling, offer empathetic support and break down the steps into simple, manageable actions
- If someone starts a conversation with a greeting (hi, hello, hey), respond with a friendly greeting back and ask how you can help with their recycling needs today
- Match the user's tone and energy — if they're casual and fun, be fun back; if they're serious, be helpful and clear

If someone asks about something unrelated to WAIZ or recycling (weather, news, math, random topics), respond warmly but redirect:
"That's a bit outside my expertise! I'm best at helping with recycling and WAIZ. Is there anything about posting items or finding junkshops I can help with? 🌿"

- A user can only have one account type — either Household or Junkshop. They cannot be both with the same account. They would need to create separate accounts for each role.

About WAIZ:
- WAIZ is a recycling marketplace in Baguio City that connects households with junkshops
- Do not invent or guess what WAIZ stands for as an acronym — it is simply the platform name
- Material categories on WAIZ: Metal, Paper, Plastic, E-waste, Glass, Secondhand, and Others (mixed or uncategorized items)

Price estimates (per kg):
- Metal/Bakal: ₱13-16
- Paper/Papel: ₱3-4
- Plastic: ₱7-9
- E-waste: ₱20-25
- Glass/Bote: ₱1.5-2.5
- Secondhand: varies

Keep responses short, punchy, and HIGH ENERGY — like an enthusiastic friend, not a customer support bot. Use exclamations, celebrate small things, and always end with encouragement or a follow-up nudge!`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  // Update greeting when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setMessages([{
        role:'assistant',
        content:`Hi, ${profile.full_name.split(' ')[0]}! I'm ECO 🌍 — your WAIZ assistant. How can I help you today?`
      }])
    }
  }, [profile])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')
    setEmotion('clicked')

    const newMessages = [...messages, { role:'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    // Navigation commands
    const navCommands = [
      { triggers:['take me to junkshop','go to junkshop','open junkshop','junkshop directory','show me junkshops','find junkshop','junkshop near','where are the junkshop'], path:'/junkshops' },
      { triggers:['take me to browse','go to browse','show listings','open browse','see listings','find listings','available items'], path:'/browse' },
      { triggers:['post item','sell scrap','post my item','upload item','i want to post','add listing','create listing'], path:'/post-item' },
      { triggers:['how it works','show guide','show tutorial','how to use','what is waiz'], path:'/how-it-works' },
      { triggers:['take me to sign up','i want to register','create account','sign up'], path:'/signup' },
      { triggers:['take me to login','i want to log in','i want to sign in','log in'], path:'/login' },
      { triggers:['my listings','my posts','what i posted'], path:'/dashboard/household' },
      { triggers:['my dashboard','go to dashboard','open dashboard'], path: profile?.role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household' },
      { triggers:['pickup request','my requests','pending requests'], path: profile?.role === 'junkshop' ? '/dashboard/junkshop?tab=requests' : '/dashboard/household?tab=requests' },
      { triggers:['messages','my messages','open chat'], path: profile?.role === 'junkshop' ? '/dashboard/junkshop?tab=messages' : '/dashboard/household?tab=messages' },
    ]

    const lowerText = userText.toLowerCase()
    let navigated = false
    for (const cmd of navCommands) {
      if (cmd.triggers.some(t => lowerText.includes(t))) {
        const isNavQuestion = lowerText.includes('where') || lowerText.includes('how') || lowerText.includes('what')
        if (!isNavQuestion || lowerText.includes('take me') || lowerText.includes('go to') || lowerText.includes('open') || lowerText.includes('show me')) {
          setMessages(prev => [...prev, {
            role:'assistant',
            content:`Sure! Taking you there now 🌿`
          }])
          setLoading(false)
          setTimeout(() => navigate(cmd.path), 800)
          navigated = true
          break
        }
      }
    }
    if (navigated) return

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eco-chat`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: userText,
            history: newMessages.slice(0, -1),
            systemPrompt: getSystemPrompt(),
          })
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        console.error('ECO API error:', errData)
        throw new Error(errData?.error || 'API error')
      }

      const data  = await res.json()
      const reply = data?.reply || "Sorry, I couldn't get a response right now. Try again!"

      setMessages(prev => [...prev, { role:'assistant', content: reply }])
      setEmotion('float')

    } catch (error) {
      console.error('ECO error:', error)
      setMessages(prev => [...prev, {
        role:'assistant',
        content: "Oops! Something went wrong. Please try again!"
      }])
      setEmotion('float')
    }
    setLoading(false)
  }

  // Drag logic
  const onMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    moved.current = false
    setDragging(true)
    setEmotion('drag')
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return
      moved.current = true
      const x = Math.max(0, Math.min(window.innerWidth  - 60, e.clientX - dragOffset.current.x))
      const y = Math.max(0, Math.min(window.innerHeight - 68, e.clientY - dragOffset.current.y))
      setPos({ x, y })
    }
    const onUp = () => {
      if (!dragging) return
      setDragging(false)
      if (!moved.current) {
        setOpen(o => !o)
        setEmotion('clicked')
        setTimeout(() => setEmotion('float'), 1500)
      } else {
        setEmotion('float')
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [dragging])

  const mascotStyle = {
    position:  'fixed',
    width:     '60px',
    height:    '68px',
    cursor:    dragging ? 'grabbing' : 'grab',
    userSelect:'none',
    zIndex:    9998,
    ...(pos.x !== null
      ? { left: pos.x, top: pos.y, right:'auto', bottom:'auto' }
      : { bottom:'20px', right:'24px' }
    )
  }

  const popupStyle = {
    position:   'fixed',
    width:      '300px',
    background: '#ffffff',
    border:     '1px solid #B7E4C7',
    borderRadius:'18px',
    overflow:   'hidden',
    zIndex:     9999,
    boxShadow:  '0 10px 36px rgba(13,43,31,0.18)',
    ...(pos.x !== null
      ? {
          left:   Math.min(pos.x + 100, window.innerWidth  - 310),
          top:    Math.max(pos.y  - 420, 8),
          right:  'auto',
          bottom: 'auto',
        }
      : { bottom:'130px', right:'24px' }
    )
  }

  return (
    <>
      {/* CHAT POPUP */}
      {open && (
        <div style={popupStyle}>

          {/* Header */}
          <div style={{ background:'#0D2B1F', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <EcoMiniIcon />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'14px', fontWeight:600, color:'#D8F3DC' }}>ECO</p>
              <span style={{ fontSize:'11px', color:'#52B788' }}>WAIZ AI Assistant</span>
            </div>

            {/* Clear button */}
            {messages.length > 1 && (
              <button
                onClick={() => setMessages([{
                  role: 'assistant',
                  content: `Hi${profile?.full_name ? ', ' + profile.full_name.split(' ')[0] : ''}! I'm ECO 🌍 — your WAIZ assistant. How can I help you today?`
                }])}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.45)', fontSize:'11px',
                  padding:'2px 8px', borderRadius:'6px',
                }}>
                Clear chat
              </button>
            )}

            <button
              onClick={() => setOpen(false)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:'18px', lineHeight:1, padding:'2px 5px' }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'8px', minHeight:'140px', maxHeight:'220px', overflowY:'auto', background:'#F9FDF7' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                background:    m.role === 'user' ? '#1A4D35' : '#E8F5E2',
                color:         m.role === 'user' ? '#fff'    : '#1A4D35',
                borderRadius:  m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                padding:       '8px 12px',
                fontSize:      '13px',
                lineHeight:    1.5,
                maxWidth:      '90%',
                alignSelf:     m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ background:'#E8F5E2', color:'#1A4D35', borderRadius:'12px 12px 12px 3px', padding:'8px 12px', fontSize:'13px', alignSelf:'flex-start', opacity:0.6, fontStyle:'italic' }}>
                ECO is thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'12px', border:'1px solid #B7E4C7', background:'#F0FDF4', color:'#1A4D35', cursor:'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ display:'flex', borderTop:'1px solid #E0EED8', padding:'8px', gap:'6px', background:'#fff' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask ECO..."
              style={{ flex:1, border:'1px solid #B7E4C7', borderRadius:'9px', padding:'7px 12px', fontSize:'13px', outline:'none', background:'#F9FDF7', color:'#1A4D35' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ background: input.trim() ? '#1A4D35' : '#B7E4C7', border:'none', borderRadius:'9px', color:'#fff', width:'34px', height:'34px', cursor: input.trim() ? 'pointer' : 'default', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              →
            </button>
          </div>
        </div>
      )}

      {/* ECO MASCOT */}
      <div style={mascotStyle} onMouseDown={onMouseDown}>
        <EcoSVG emotion={emotion} />
      </div>
    </>
  )
}

function EcoMiniIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="13" r="12" fill="#2D6A4F"/>
      <circle cx="9.5"  cy="12" r="4.5" fill="#fff" stroke="#C8A84E" strokeWidth="0.9"/>
      <circle cx="17.5" cy="12" r="4.5" fill="#fff" stroke="#C8A84E" strokeWidth="0.9"/>
      <circle cx="10"   cy="12.5" r="2.5" fill="#1A3A14"/>
      <circle cx="18"   cy="12.5" r="2.5" fill="#1A3A14"/>
      <circle cx="11"   cy="11.3" r="1"   fill="#fff"/>
      <circle cx="19"   cy="11.3" r="1"   fill="#fff"/>
      <path d="M8,18 Q13,23 18,18" stroke="#1A3A14" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function EcoSVG({ emotion }) {
  const isFloat   = emotion === 'float'
  const isDrag    = emotion === 'drag'
  const isClicked = emotion === 'clicked'

  return (
    <svg
      width="60" height="68" viewBox="0 0 170 170"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: isFloat ? 'eco-bob 2.3s ease-in-out infinite' : 'none',
        filter:'drop-shadow(0 4px 12px rgba(13,43,31,0.25))'
      }}>

      <style>{`
        @keyframes eco-bob    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes eco-blink  { 0%,90%,100%{transform:scaleY(1)} 94%{transform:scaleY(0.06)} }
        @keyframes eco-spark  { 0%,78%,100%{opacity:0;transform:scale(0.3)} 86%,93%{opacity:1;transform:scale(1)} }
        @keyframes eco-gear-cw  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes eco-gear-ccw { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>

      <defs>
        <radialGradient id="eco-shine" cx="35%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* HEAD */}
      <circle cx="85" cy="88" r="72" fill="#2D6A4F"/>
      <ellipse cx="64"  cy="68"  rx="18" ry="28" fill="#3a7a32" opacity="0.55"/>
      <ellipse cx="110" cy="96"  rx="15" ry="22" fill="#3a7a32" opacity="0.45"/>
      <circle cx="85" cy="88" r="72" fill="none" stroke="#1A4D35" strokeWidth="2.5"/>

      {/* EYES — happy */}
      {!isDrag && !isClicked && (
        <g style={{ animation:'eco-blink 5s ease-in-out infinite' }}>
          <circle cx="60"  cy="80" r="24" fill="#fff" stroke="#C8A84E" strokeWidth="2"/>
          <circle cx="110" cy="80" r="24" fill="#fff" stroke="#C8A84E" strokeWidth="2"/>
          <circle cx="62"  cy="82" r="15" fill="#1A3A14"/>
          <circle cx="112" cy="82" r="15" fill="#1A3A14"/>
          <circle cx="55"  cy="74" r="6"  fill="#fff"/>
          <circle cx="105" cy="74" r="6"  fill="#fff"/>
          <circle cx="66"  cy="83" r="2"  fill="#fff" opacity="0.6"/>
          <circle cx="116" cy="83" r="2"  fill="#fff" opacity="0.6"/>
        </g>
      )}

      {/* EYES — drag squint */}
      {isDrag && (
        <g>
          <path d="M36,80  Q60,62 84,80"  stroke="#1A3A14" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M86,80  Q110,62 134,80" stroke="#1A3A14" strokeWidth="5" fill="none" strokeLinecap="round"/>
        </g>
      )}

      {/* EYES — star clicked */}
      {isClicked && (
        <g>
          <circle cx="60"  cy="80" r="24" fill="#fff" stroke="#C8A84E" strokeWidth="2"/>
          <circle cx="110" cy="80" r="24" fill="#fff" stroke="#C8A84E" strokeWidth="2"/>
          <text x="60"  y="89" fontSize="26" textAnchor="middle" fill="#C8A84E">★</text>
          <text x="110" y="89" fontSize="26" textAnchor="middle" fill="#C8A84E">★</text>
        </g>
      )}

      {/* MOUTH */}
      {!isDrag && (
        <path d="M60,116 Q85,136 110,116" stroke="#1A3A14" strokeWidth="4" fill="none" strokeLinecap="round"/>
      )}
      {isDrag && (
        <ellipse cx="85" cy="122" rx="9" ry="11" fill="#1A3A14"/>
      )}

      {/* BLUSH */}
      <ellipse cx="38"  cy="104" rx="9" ry="5" fill="#f4c0d1" opacity={isDrag ? 0.9 : 0.55}/>
      <ellipse cx="132" cy="104" rx="9" ry="5" fill="#f4c0d1" opacity={isDrag ? 0.9 : 0.55}/>

      {/* SPARKLES */}
      <g style={{ animation:'eco-spark 3.6s ease-in-out infinite' }}>
        <line x1="18" y1="48" x2="18" y2="39" stroke="#C8A84E" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="13.5" y1="43.5" x2="22.5" y2="43.5" stroke="#C8A84E" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
      <g style={{ animation:'eco-spark 3.6s ease-in-out 0.75s infinite' }}>
        <line x1="150" y1="44" x2="150" y2="35" stroke="#C8A84E" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="145.5" y1="39.5" x2="154.5" y2="39.5" stroke="#C8A84E" strokeWidth="2.2" strokeLinecap="round"/>
      </g>

      {/* GEAR */}
      <g style={{ transformOrigin:'146px 26px', animation:'eco-gear-cw 6s linear infinite' }}>
        <circle cx="146" cy="26" r="13"  fill="#C8A84E"/>
        <circle cx="146" cy="26" r="8"   fill="#f5e8b0"/>
        <circle cx="146" cy="26" r="4"   fill="#C8A84E"/>
        <rect x="144.3" y="11.5" width="3.4" height="5" rx="1.5" fill="#C8A84E"/>
        <rect x="144.3" y="34.5" width="3.4" height="5" rx="1.5" fill="#C8A84E"/>
        <rect x="129.5" y="24.3" width="5"   height="3.4" rx="1.5" fill="#C8A84E"/>
        <rect x="152"   y="24.3" width="5"   height="3.4" rx="1.5" fill="#C8A84E"/>
      </g>
      <g style={{ transformOrigin:'126px 14px', animation:'eco-gear-ccw 3.5s linear infinite' }}>
        <circle cx="126" cy="14" r="8"   fill="#e8c84e"/>
        <circle cx="126" cy="14" r="5"   fill="#f5e8b0"/>
        <circle cx="126" cy="14" r="2.5" fill="#e8c84e"/>
        <rect x="124.6" y="5"    width="2.8" height="3.8" rx="1.3" fill="#e8c84e"/>
        <rect x="124.6" y="17.2" width="2.8" height="3.8" rx="1.3" fill="#e8c84e"/>
        <rect x="118.2" y="12.6" width="3.8" height="2.8" rx="1.3" fill="#e8c84e"/>
        <rect x="130"   y="12.6" width="3.8" height="2.8" rx="1.3" fill="#e8c84e"/>
      </g>
    </svg>
  )
}