import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MISSION_CARDS = [
  {
    label: 'Our Mission',
    text: 'To make recycling effortless and rewarding for every household in Baguio City — by connecting them directly with trusted local junkshops.',
    color: '#2D6A4F',
    textColor: '#B7E4C7',
  },
  {
    label: 'Our Vision',
    text: 'A Baguio City where no recyclable goes to waste. Where junkshops thrive, households earn, and every barangay is a little bit cleaner.',
    color: '#1B4332',
    textColor: '#74C69D',
  },
]

const HOW_ITEMS = [
  {
    num: '01',
    title: 'Fewer trips, less fuel',
    desc: 'Junkshops only travel to confirmed pickups — no more cold-calling streets. Fewer wasted trips means lower emissions across the city.',
  },
  {
    num: '02',
    title: 'Fair prices, every time',
    desc: 'Junkshops publish their buying rates publicly. Households can compare and choose — no more guessing or accepting low-ball offers.',
  },
  {
    num: '03',
    title: 'Recyclables stay local',
    desc: 'Materials collected through WAIZ go to verified Baguio junkshops — keeping the economic benefit inside the city.',
  },
  {
    num: '04',
    title: 'Less clutter, cleaner homes',
    desc: 'WAIZ makes it easy to let go of scrap that would otherwise pile up. A cleaner home is the first step to a cleaner city.',
  },
]

const TEAM = [
  { initials: 'HA', name: 'HEZREEN ABELLERA',   role: 'Hacker', img: '/team/member1.jpg' },
  { initials: 'AE', name: 'ADONAIKAH EVASCO',   role: 'Hustler', img: '/team/member2.jpg' },
  { initials: 'MG', name: 'MARIANNE GUNDRAN', role: 'Hipster', img: '/team/member3.jpg' },
]

const SDGS = [
  {
    num: '11',
    color: '#F99D26',
    title: 'Sustainable Cities & Communities',
    target: 'Target 11.6',
    desc: 'WAIZ directly reduces the environmental impact of Baguio City by improving how municipal waste is collected, sorted, and redirected — keeping recyclables out of landfills and into the right hands.',
  },
  {
    num: '12',
    color: '#BF8B2E',
    title: 'Responsible Consumption & Production',
    target: 'Target 12.5',
    desc: 'By creating real economic incentives to recycle, WAIZ drives systemic change in how Baguio households and junkshops handle materials — turning waste reduction from a moral appeal into a marketplace reality.',
  },
]

export default function About() {
  const { user, profile } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const fade = (delay) => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
  })

  const stars = [
    { top:'8%',left:'9%',s:2,dur:2.8,d:0},{top:'13%',left:'34%',s:2.5,dur:3.2,d:.5},
    {top:'6%',left:'58%',s:2,dur:2.6,d:1},{top:'19%',left:'79%',s:2,dur:3.6,d:.3},
    {top:'5%',left:'91%',s:3,dur:2.9,d:1.4},{top:'25%',left:'21%',s:2,dur:3.1,d:.8},
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FEFDF8' }}>

      <style>{`
        @keyframes waiz-twinkle { 0%,100%{opacity:.1} 50%{opacity:.7} }
        .about-how-card { transition: transform .25s ease, box-shadow .25s ease; }
        .about-how-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(29,75,53,0.35); }
        .about-team-card { transition: transform .22s ease; }
        .about-team-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* NAV */}
      <nav style={{
        position:'sticky', top:0, zIndex:50,
        width:'100%', height:56,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 32px',
        borderBottom:'1px solid rgba(0,0,0,0.2)',
        backgroundColor:'rgba(254,253,248,0.92)',
        backdropFilter:'blur(8px)',
      }}>
        <Link to="/" style={{
          fontFamily:'Georgia, serif', fontSize:22, fontWeight:700,
          color:'#1B4332', letterSpacing:'2px', textDecoration:'none',
        }}>
          WA<span style={{ color:'#c8a84e' }}>I</span>Z
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <Link to="/"             style={{ fontSize:13, color:'#2D6A4F', textDecoration:'none' }}>Home</Link>
          <Link to="/how-it-works" style={{ fontSize:13, color:'#2D6A4F', textDecoration:'none' }}>How It Works</Link>
          <Link to="/about"        style={{ fontSize:13, color:'#2D6A4F', textDecoration:'none' }}>About</Link>
          <Link to="/junkshops"    style={{ fontSize:13, color:'#2D6A4F', textDecoration:'none' }}>Junkshops</Link>
          <div style={{ width:1, height:16, background:'rgba(0,0,0,0.25)' }} />
          {user ? (
            <Link
              to={profile?.role === 'junkshop' ? '/dashboard/junkshop' : '/dashboard/household'}
              style={{
                fontSize:13, fontWeight:600, color:'#fff',
                background:'#1B4332', padding:'7px 18px',
                borderRadius:99, textDecoration:'none',
              }}>
              Dashboard
            </Link>
          ) : (
            <div style={{ display:'flex', gap:10 }}>
              <Link to="/login" style={{
                fontSize:13, color:'#2D6A4F',
                border:'1px solid rgba(29,75,53,0.6)',
                padding:'6px 16px', borderRadius:99, textDecoration:'none',
              }}>Log in</Link>
              <Link to="/signup" style={{
                fontSize:13, fontWeight:600, color:'#fff',
                background:'#1B4332', padding:'7px 18px',
                borderRadius:99, textDecoration:'none',
              }}>Sign up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position:'relative',
        background:'#0a1a0c',
        padding:'90px 32px 110px',
        textAlign:'center',
        overflow:'hidden',
      }}>
        {stars.map((st, i) => (
          <div key={i} style={{
            position:'absolute', top:st.top, left:st.left,
            width:st.s, height:st.s, borderRadius:'50%', background:'#fff',
            animation:`waiz-twinkle ${st.dur}s ease-in-out ${st.d}s infinite`,
            pointerEvents:'none',
          }} />
        ))}
        <svg style={{ position:'absolute',bottom:0,left:0,width:'100%',pointerEvents:'none' }}
          height="110" viewBox="0 0 1200 110" preserveAspectRatio="none">
          <polygon points="0,110 160,35 320,110"     fill="#111f13"/>
          <polygon points="200,110 420,12 640,110"   fill="#152318"/>
          <polygon points="600,110 840,45 1080,110"  fill="#111f13"/>
          <polygon points="900,110 1100,22 1300,110" fill="#152318"/>
          <rect x="0" y="100" width="1200" height="10" fill="#0a1a0c"/>
        </svg>
        <div style={{ position:'relative', zIndex:2, maxWidth:620, margin:'0 auto' }}>
          <p style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase',
            color:'#7dcc6e', marginBottom:16, ...fade(0.2) }}>
            About WAIZ
          </p>
          <h1 style={{
            fontFamily:'Georgia, serif',
            fontSize:'clamp(36px,6.5vw,60px)',
            fontWeight:700, color:'#f0ffe8',
            lineHeight:1.12, marginBottom:22,
            ...fade(0.45),
          }}>
            Recycling made easy.<br />
            <span style={{ color:'#c8a84e' }}>For all of Baguio.</span>
          </h1>
          <p style={{
            fontSize:16, color:'#a8d898', lineHeight:1.8,
            maxWidth:460, margin:'0 auto 40px',
            ...fade(0.65),
          }}>
            WAIZ is Baguio City's free eco marketplace — connecting households
            with verified local junkshops so recyclables get where they belong,
            and everyone comes out ahead.
          </p>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section style={{ backgroundColor:'#FEFDF8', padding:'80px 32px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <span style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'#52B788', fontWeight:500 }}>Why We Exist</span>
            <h2 style={{
              fontFamily:'Georgia, serif',
              fontSize:'clamp(24px,3.5vw,36px)',
              fontWeight:700, color:'#1B4332', marginTop:10,
            }}>Mission & Vision</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
            {MISSION_CARDS.map((card, i) => (
              <div key={i} style={{
                backgroundColor:card.color,
                borderRadius:24, padding:'40px 36px',
              }}>
                <span style={{
                  display:'inline-block',
                  fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
                  color:'rgba(255,255,255,0.45)', marginBottom:16, fontWeight:600,
                }}>{card.label}</span>
                <p style={{
                  fontSize:17, color:card.textColor,
                  lineHeight:1.85, fontFamily:'Georgia, serif',
                }}>
                  "{card.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WAIZ HELPS BAGUIO */}
      <section style={{ backgroundColor:'#fff', padding:'80px 32px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'#52B788', fontWeight:500 }}>Our Impact</span>
            <h2 style={{
              fontFamily:'Georgia, serif',
              fontSize:'clamp(24px,3.5vw,36px)',
              fontWeight:700, color:'#1B4332', marginTop:10,
            }}>How WAIZ helps Baguio City</h2>
            <p style={{ fontSize:14, color:'#6B7280', marginTop:12, maxWidth:460, margin:'12px auto 0' }}>
              Every listing posted and every pickup completed ripples outward
              into a cleaner, more connected city.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:18 }}>
            {HOW_ITEMS.map((item, i) => (
              <div key={i} className="about-how-card" style={{
                backgroundColor:'#F4FCF6',
                border:'1px solid #D8F3DC',
                borderRadius:20, padding:'32px 30px',
                display:'flex', gap:20,
              }}>
                <div style={{
                  fontFamily:'Georgia, serif',
                  fontSize:32, fontWeight:700,
                  color:'#D8F3DC', lineHeight:1,
                  flexShrink:0, marginTop:2,
                }}>{item.num}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:'#1B4332', marginBottom:8 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize:13, color:'#52796F', lineHeight:1.78 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDGs */}
      <section style={{ backgroundColor:'#FEFDF8', padding:'80px 32px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <span style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'#52B788', fontWeight:500 }}>Global Framework</span>
            <h2 style={{
              fontFamily:'Georgia, serif',
              fontSize:'clamp(24px,3.5vw,36px)',
              fontWeight:700, color:'#1B4332', marginTop:10,
            }}>Aligned with the UN SDGs</h2>
            <p style={{ fontSize:14, color:'#6B7280', marginTop:12, maxWidth:520, margin:'12px auto 0' }}>
              WAIZ operationalizes global sustainability goals at the local level —
              making Baguio City a model for community-driven environmental action.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
            {SDGS.map((sdg, i) => (
              <div key={i} style={{
                border:`2px solid ${sdg.color}22`,
                backgroundColor:'#fff',
                borderRadius:24, padding:'36px 32px',
                display:'flex', gap:24, alignItems:'flex-start',
              }}>
                {/* SDG badge */}
                <div style={{
                  flexShrink:0,
                  width:64, height:64, borderRadius:14,
                  backgroundColor: sdg.color,
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  color:'#fff',
                }}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', opacity:.85 }}>SDG</div>
                  <div style={{ fontSize:26, fontWeight:900, lineHeight:1, fontFamily:'Georgia, serif' }}>{sdg.num}</div>
                </div>
                <div>
                  <div style={{
                    display:'inline-block',
                    fontSize:10, fontWeight:700, letterSpacing:'0.14em',
                    textTransform:'uppercase', color: sdg.color,
                    backgroundColor:`${sdg.color}18`,
                    padding:'3px 10px', borderRadius:99, marginBottom:10,
                  }}>{sdg.target}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1B4332', marginBottom:8 }}>
                    {sdg.title}
                  </div>
                  <div style={{ fontSize:13, color:'#52796F', lineHeight:1.78 }}>
                    {sdg.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* UN quote */}
          <div style={{
            marginTop:28, borderLeft:'3px solid #D8F3DC',
            paddingLeft:20, color:'#52796F', fontSize:13, lineHeight:1.75,
            fontStyle:'italic',
          }}>
            "By leveraging marketplace dynamics, empathetic AI communication, and inclusive
            socio-economic design, WAIZ turns global sustainability targets into
            everyday action for every Baguio household and junkshop."
          </div>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section style={{ backgroundColor:'#D8F3DC', padding:'80px 32px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
          <span style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase',
            color:'#52B788', fontWeight:500 }}>The People Behind It</span>
          <h2 style={{
            fontFamily:'Georgia, serif',
            fontSize:'clamp(24px,3.5vw,36px)',
            fontWeight:700, color:'#1B4332', margin:'10px 0 12px',
          }}>Meet the team</h2>
          <p style={{ fontSize:14, color:'#2D6A4F', maxWidth:420, margin:'0 auto 44px' }}>
            A small, passionate group of Baguio locals who believe technology
            can make our city's recycling ecosystem work better for everyone.
          </p>
          <div style={{ display:'flex', gap:18, justifyContent:'center', flexWrap:'wrap' }}>
            {TEAM.map((m, i) => (
              <div key={i} className="about-team-card" style={{
                backgroundColor:'#fff',
                borderRadius:20, padding:'32px 28px',
                textAlign:'center',
                minWidth:180, flex:'1 1 180px', maxWidth:200,
                boxShadow:'0 2px 12px rgba(29,75,53,0.25)',
              }}>
                <div style={{
  width:100, height:100, borderRadius:'50%',
  overflow:'hidden', margin:'0 auto 16px',
  backgroundColor:'#1B4332',
  display:'flex', alignItems:'center', justifyContent:'center',
}}>
  <img
    src={m.img}
    alt={m.name}
    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
    style={{ width:'100%', height:'100%', objectFit:'cover' }}
  />
  <span style={{
    display:'none', width:'100%', height:'100%',
    alignItems:'center', justifyContent:'center',
    fontFamily:'Georgia, serif', fontSize:22, fontWeight:700,
    color:'#D8F3DC',
  }}>{m.initials}</span>
</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#1B4332', marginBottom:5 }}>
                  {m.name}
                </div>
                <div style={{ fontSize:12, color:'#52796F' }}>{m.role}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:'#74a86a', marginTop:32 }}>
            Based in Baguio City, Benguet — building for the community we call home.
          </p>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section style={{
        background:'linear-gradient(160deg,#0a1a0c 0%,#1B4332 100%)',
        padding:'90px 32px', textAlign:'center',
      }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <p style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase',
            color:'#7dcc6e', marginBottom:16 }}>
            Ready to make a difference?
          </p>
          <h2 style={{
            fontFamily:'Georgia, serif',
            fontSize:'clamp(28px,4.5vw,46px)',
            fontWeight:700, color:'#f0ffe8',
            lineHeight:1.15, marginBottom:18,
          }}>
            Baguio's scrap deserves<br />a better destination.
          </h2>
          <p style={{ fontSize:15, color:'#a8d898', lineHeight:1.75, marginBottom:38 }}>
            Join WAIZ for free — whether you're a household with scrap to
            sell or a junkshop looking to grow.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/signup" style={{
              background:'#a8e898', color:'#0a1a0c',
              borderRadius:99, padding:'14px 36px',
              fontSize:14, fontWeight:700, textDecoration:'none',
            }}>Create free account</Link>
            <Link to="/" style={{
              background:'transparent', color:'#7dcc6e',
              border:'1.5px solid #3a7a32',
              borderRadius:99, padding:'14px 36px',
              fontSize:14, fontWeight:500, textDecoration:'none',
            }}>Back to home</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor:'#0a1a0c', padding:'22px 32px' }}>
        <div style={{
          maxWidth:960, margin:'0 auto',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <Link to="/" style={{
            fontFamily:'Georgia, serif', fontSize:16, fontWeight:700,
            color:'#a8e898', letterSpacing:'2px', textDecoration:'none',
          }}>
            WA<span style={{ color:'#c8a84e' }}>I</span>Z
          </Link>
          <span style={{ fontSize:11, color:'#4a7a52' }}>© 2025 WAIZ · Baguio City, Philippines</span>
        </div>
      </footer>

    </div>
  )
}