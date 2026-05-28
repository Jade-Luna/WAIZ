import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import ContactModal from '../components/ContactModal'
import TermsModal    from '../components/TermsModal'
import PrivacyModal  from '../components/PrivacyModal'

// ─── data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'metal',      label: 'Metal',      sub: 'Scrap, pipes, cans',   bg: '#E1F5EE', iconBg: '#B7E4C7', iconColor: '#085041', abbr: 'Fe' },
  { key: 'paper',      label: 'Paper',      sub: 'Cardboard, books',      bg: '#EAF3DE', iconBg: '#C0DD97', iconColor: '#173404', abbr: 'Pa' },
  { key: 'plastic',    label: 'Plastic',    sub: 'Bottles, containers',   bg: '#E6F1FB', iconBg: '#B5D4F4', iconColor: '#042C53', abbr: 'Pl' },
  { key: 'ewaste',     label: 'E-waste',    sub: 'Electronics, cables',   bg: '#FAEEDA', iconBg: '#FAC775', iconColor: '#412402', abbr: 'EW' },
  { key: 'glass',      label: 'Glass',      sub: 'Bottles, jars',         bg: '#EEEDFE', iconBg: '#CECBF6', iconColor: '#26215C', abbr: 'Gl' },
  { key: 'secondhand', label: 'Secondhand', sub: 'Clothes, appliances',   bg: '#FBEAF0', iconBg: '#F4C0D1', iconColor: '#4B1528', abbr: 'Uk' },
]

const STEPS = {
  household: [
    { n: 1, title: 'Post your item',          desc: 'Snap a photo, pick a category, and drop your pin in Baguio City. Done in under 2 minutes. No fees, ever.' },
    { n: 2, title: 'Get pickup requests',     desc: 'Verified junkshops near you browse your listing and send pickup requests with their offered price per kilo.' },
    { n: 3, title: 'Earn and make an impact', desc: 'Confirm a pickup, hand over your items, get paid on the spot. Rate the junkshop and help others choose wisely.' },
  ],
  junkshop: [
    { n: 1, title: 'Set your price board',    desc: 'Register your shop and publish your buying rates per material. Households will see and compare your prices.' },
    { n: 2, title: 'Browse available items',  desc: 'Filter listings by category, weight, and barangay. Find materials that match what your shop needs right now.' },
    { n: 3, title: 'Request and pick up',     desc: 'Send a pickup request with your offered price, confirm a schedule with the household, and collect the goods.' },
  ],
}

// ─── floating items for the hero background ──────────────────────────────────

const FLOAT_ITEMS = [
  { id: 'bottle', x: '6%',  dur: 5.2, delay: 0,   el: <svg width="22" height="36" viewBox="0 0 22 36"><rect x="7" y="0" width="8" height="6" rx="2" fill="#7dcc6e" opacity=".8"/><rect x="3" y="6" width="16" height="26" rx="6" fill="#5aaa4e" opacity=".85"/><rect x="6" y="18" width="10" height="2" rx="1" fill="#fff" opacity=".3"/></svg> },
  { id: 'paper',  x: '19%', dur: 6.8, delay: 1.4, el: <svg width="28" height="32" viewBox="0 0 28 32"><rect x="2" y="2" width="24" height="28" rx="2" fill="#e8c84e" opacity=".9"/><line x1="7" y1="10" x2="21" y2="10" stroke="#fff" strokeWidth="1.5" opacity=".4"/><line x1="7" y1="16" x2="21" y2="16" stroke="#fff" strokeWidth="1.5" opacity=".4"/></svg> },
  { id: 'can',    x: '35%', dur: 5.6, delay: 0.8, el: <svg width="24" height="32" viewBox="0 0 24 32"><ellipse cx="12" cy="4" rx="10" ry="3.5" fill="#999"/><rect x="2" y="4" width="20" height="24" fill="#bbb"/><ellipse cx="12" cy="28" rx="10" ry="3.5" fill="#888"/></svg> },
  { id: 'phone',  x: '53%', dur: 7.2, delay: 2.2, el: <svg width="22" height="34" viewBox="0 0 22 34"><rect x="1" y="1" width="20" height="32" rx="4" fill="#534AB7" opacity=".9"/><rect x="4" y="5" width="14" height="20" rx="1" fill="#1a1a3a" opacity=".7"/></svg> },
  { id: 'bag',    x: '69%', dur: 5.0, delay: 0.4, el: <svg width="26" height="30" viewBox="0 0 26 30"><path d="M8,4 Q13,0 18,4 L22,28 Q13,32 4,28 Z" fill="#7dcc6e" opacity=".75"/><line x1="9" y1="4" x2="7" y2="0" stroke="#5aaa4e" strokeWidth="1.5"/><line x1="17" y1="4" x2="19" y2="0" stroke="#5aaa4e" strokeWidth="1.5"/></svg> },
  { id: 'metal',  x: '84%', dur: 6.4, delay: 1.8, el: <svg width="32" height="24" viewBox="0 0 32 24"><rect x="2" y="8" width="28" height="8" rx="2" fill="#aaa" opacity=".85"/><rect x="6" y="4" width="6" height="4" rx="1" fill="#888" opacity=".75"/><rect x="20" y="4" width="6" height="4" rx="1" fill="#888" opacity=".75"/></svg> },
]

const COINS = [
  { x: '12%', dur: 5.2, delay: 2.8 },
  { x: '28%', dur: 6.8, delay: 4.0 },
  { x: '46%', dur: 5.6, delay: 2.2 },
  { x: '64%', dur: 7.2, delay: 3.6 },
  { x: '82%', dur: 5.0, delay: 1.6 },
]

const STARS = [
  { top: '8%',  left: '10%', s: 2,   dur: 2.8, delay: 0   },
  { top: '14%', left: '33%', s: 2.5, dur: 3.2, delay: 0.5 },
  { top: '6%',  left: '57%', s: 2,   dur: 2.6, delay: 1.0 },
  { top: '18%', left: '78%', s: 2,   dur: 3.6, delay: 0.3 },
  { top: '5%',  left: '90%', s: 3,   dur: 2.9, delay: 1.4 },
  { top: '24%', left: '20%', s: 2,   dur: 3.1, delay: 0.8 },
  { top: '11%', left: '68%', s: 2,   dur: 2.7, delay: 1.9 },
  { top: '30%', left: '88%', s: 1.5, dur: 3.4, delay: 0.6 },
]

// ─── component ───────────────────────────────────────────────────────────────

export default function Home() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('household')
  const [visible, setVisible] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFDF8' }}>

      {/* ── HERO (dark, animated) ─────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: '#0a1a0c',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>

        <style>{`
          @keyframes waiz-twinkle   { 0%,100%{opacity:.15} 50%{opacity:.9} }
          @keyframes waiz-float-up  {
            0%   { opacity:0; transform:translateY(0) rotate(0deg) scale(.8); }
            10%  { opacity:.8; }
            80%  { opacity:.8; }
            100% { opacity:0; transform:translateY(-320px) rotate(18deg) scale(1.05); }
          }
          @keyframes waiz-coin-up {
            0%   { opacity:0; transform:translateY(0) scale(.6); }
            15%  { opacity:1; transform:translateY(-18px) scale(1); }
            85%  { opacity:1; }
            100% { opacity:0; transform:translateY(-300px) scale(.8); }
          }
          @keyframes waiz-pulse-btn {
            0%,100% { box-shadow:0 0 0 0 rgba(200,168,78,.4); }
            50%     { box-shadow:0 0 0 10px rgba(200,168,78,0); }
          }
          @keyframes waiz-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        {/* starfield */}
        {STARS.map((st, i) => (
          <div key={i} style={{
            position: 'absolute', top: st.top, left: st.left,
            width: st.s, height: st.s,
            borderRadius: '50%', background: '#fff',
            animation: `waiz-twinkle ${st.dur}s ease-in-out ${st.delay}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* mountain silhouettes */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none' }}
          height="200" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <polygon points="0,200 180,50 360,200"    fill="#111f13" />
          <polygon points="140,200 340,16 540,200"  fill="#152318" />
          <polygon points="340,200 560,75 780,200"  fill="#111f13" />
          <polygon points="600,200 820,90 1040,200" fill="#152318" />
          <polygon points="860,200 1060,36 1260,200" fill="#111f13" />
          <rect x="0" y="188" width="1200" height="12" fill="#0a1a0c" />
        </svg>

        {/* floating recycling items */}
        {FLOAT_ITEMS.map(item => (
          <div key={item.id} style={{
            position: 'absolute', left: item.x, bottom: '18%',
            animation: `waiz-float-up ${item.dur}s ease-in-out ${item.delay}s infinite`,
            opacity: 0, pointerEvents: 'none',
          }}>
            {item.el}
          </div>
        ))}

        {/* coins */}
        {COINS.map((coin, i) => (
          <div key={i} style={{
            position: 'absolute', left: coin.x, bottom: '54%',
            width: 24, height: 24, borderRadius: '50%',
            background: '#c8a84e',
            border: '1.5px solid #a88830',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#7a5c10', fontWeight: 700,
            animation: `waiz-coin-up ${coin.dur}s ease-in-out ${coin.delay}s infinite`,
            opacity: 0, pointerEvents: 'none',
          }}>₱</div>
        ))}

        {/* NAV */}
        <Navigation />

        {/* hero text */}
        <div style={{
          flex: 1, position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: 'clamp(24px, 5vw, 40px) clamp(12px, 4vw, 24px) clamp(40px, 10vw, 80px)',
        }}>
          <p style={{
            fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#7dcc6e', margin: '0 0 16px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity .7s ease .3s, transform .7s ease .3s',
          }}>
            Baguio City's Recycling Marketplace
          </p>

          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(38px, 7vw, 68px)',
            fontWeight: 700, color: '#f0ffe8',
            lineHeight: 1.1, margin: '0 0 20px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity .7s ease .6s, transform .7s ease .6s',
          }}>
            Turn your scrap<br />
            into cash. <span style={{ color: '#c8a84e' }}>Wisely.</span>
          </h1>

          <p style={{
            fontSize: 16, color: '#a8d898', lineHeight: 1.7,
            margin: '0 0 36px', maxWidth: 480,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity .7s ease .9s, transform .7s ease .9s',
          }}>
            WAIZ connects Baguio households with verified local junkshops.
            Post your recyclables — and let junkshops come to you.
          </p>


          {/* CTAs */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity .7s ease 1.1s, transform .7s ease 1.1s',
          }}>
            <Link to="/signup" style={{
              background: '#2d5a27', color: '#d4f0ce',
              borderRadius: 99, padding: '13px 34px',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              animation: 'waiz-pulse-btn 2.5s ease-in-out 2s infinite',
            }}>
              Post your scrap
            </Link>
            <Link to="/junkshops" style={{
              background: 'transparent', color: '#7dcc6e',
              border: '1.5px solid #3a7a32',
              borderRadius: 99, padding: '13px 34px',
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}>
              Browse junkshops
            </Link>
          </div>

          <p style={{
            fontSize: 11, color: '#4a7a52', margin: '14px 0 0',
            opacity: visible ? 1 : 0,
            transition: 'opacity .7s ease 1.3s',
          }}>
            Free for all Baguio City households and registered junkshops
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-8 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#52B788' }}>How It Works</div>
            <h2 className="text-2xl md:text-3xl font-medium text-gray-800">Simple, fast, and completely free</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-2">Three steps — for households and junkshops alike</p>
          </div>

          <div className="flex flex-col md:flex-row border border-gray-200 rounded-xl overflow-hidden w-fit mx-auto mb-6 md:mb-8">
            {['household', 'junkshop'].map(t => (
              <button key={t}
                onClick={() => setActiveTab(t)}
                className="px-4 md:px-6 py-2 text-xs md:text-sm font-medium transition"
                style={{
                  backgroundColor: activeTab === t ? '#2D6A4F' : 'transparent',
                  color: activeTab === t ? '#fff' : '#6B7280',
                }}>
                {t === 'household' ? 'For Households' : 'For Junkshops'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {STEPS[activeTab].map(step => (
              <div key={step.n} className="rounded-2xl p-4 md:p-6 text-center" style={{ backgroundColor: '#D8F3DC' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white mx-auto mb-4"
                  style={{ backgroundColor: '#2D6A4F' }}>
                  {step.n}
                </div>
                <h3 className="text-xs md:text-sm font-medium mb-2" style={{ color: '#1B4332' }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#2D6A4F' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="py-8 md:py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#52B788' }}>Browse by Category</div>
            <h2 className="text-2xl md:text-3xl font-medium text-gray-800">What are you recycling today?</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-2">From scrap metal to secondhand clothes — WAIZ covers all recyclables</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {CATEGORIES.map(cat => (
              <Link to={`/browse?category=${cat.key}`} key={cat.key}
                className="rounded-2xl p-3 md:p-4 text-center border border-gray-100 hover:border-green-300 transition cursor-pointer"
                style={{ backgroundColor: cat.bg }}>
                <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-xs font-medium"
                  style={{ backgroundColor: cat.iconBg, color: cat.iconColor }}>
                  {cat.abbr}
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-700">{cat.label}</div>
                <div className="text-xs text-gray-400 mt-1 hidden md:block">{cat.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── JUNKSHOP DIRECTORY ───────────────────────────────────────────── */}
      <section className="py-8 md:py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#52B788' }}>Junkshop Directory</div>
            <h2 className="text-2xl md:text-3xl font-medium text-gray-800">Verified junkshops in Baguio City</h2>
            <p className="text-xs md:text-sm text-gray-400 mt-2">Compare buying rates and find the best junkshop for your materials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#D8F3DC' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A4D35" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm font-medium text-gray-400">Verified Junkshop</div>
                    <div className="text-xs text-gray-300">Baguio City</div>
                  </div>
                </div>
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-300 text-center py-2">Sign in to view rates and contact details</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 md:mt-8">
            <Link to="/signup"
              className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-medium text-white inline-block"
              style={{ backgroundColor: '#1A4D35' }}>
              Sign up to view all junkshops
            </Link>
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ─────────────────────────────────────────────────────── */}
      <section className="py-8 md:py-16 px-4 md:px-8" style={{ backgroundColor: '#D8F3DC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#52B788' }}>Join WAIZ</div>
            <h2 className="text-2xl md:text-3xl font-medium" style={{ color: '#1B4332' }}>Who are you?</h2>
            <p className="text-xs md:text-sm mt-2" style={{ color: '#2D6A4F' }}>Free registration — open to all Baguio City residents and junkshops</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: '#2D6A4F' }}>
              <h3 className="text-lg md:text-xl font-medium text-white mb-3">I'm a Household</h3>
              <p className="text-xs md:text-sm leading-relaxed mb-6" style={{ color: '#B7E4C7' }}>
                Have scrap metal, old appliances, or recyclables piling up? Post them for free and let verified junkshops come to you. Earn cash and help keep Baguio clean.
              </p>
              <Link to="/signup"
                className="inline-block px-5 py-2.5 rounded-xl text-xs md:text-sm font-medium bg-white"
                style={{ color: '#2D6A4F', textDecoration: 'none' }}>
                Sign up as a Household
              </Link>
            </div>
            <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: '#1B4332' }}>
              <h3 className="text-lg md:text-xl font-medium text-white mb-3">I'm a Junkshop</h3>
              <p className="text-xs md:text-sm leading-relaxed mb-6" style={{ color: '#74C69D' }}>
                Browse available recyclables across all of Baguio City. Set your buying rates, accept pickup requests, and grow your collection volume from one dashboard.
              </p>
              <Link to="/signup?role=junkshop"
                className="inline-block px-5 py-2.5 rounded-xl text-xs md:text-sm font-medium"
                style={{ backgroundColor:'#E9935A', color:'#fff', textDecoration: 'none' }}>
                Sign up as a Junkshop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#1B4332' }} className="px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-8 md:mb-10">
          <div>
            <div className="text-lg md:text-xl font-medium tracking-widest mb-3" style={{ fontFamily: 'Georgia, serif', color: '#D8F3DC' }}>
              WA<span style={{ color: '#E9935A' }}>I</span>Z
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#74C69D' }}>
              Baguio City's marketplace for recyclables, e-waste, and secondhand goods. Connecting households and junkshops for a cleaner, greener city.
            </p>
          </div>
          {[
            { title: 'Explore', links: [
              { label: 'How it works',       path: '/how-it-works' },
              { label: 'Junkshop directory', path: '/junkshops'    },
              { label: 'Sign up',            path: '/signup'       },
              { label: 'Log in',             path: '/login'        },
              { label: 'Privacy Policy', path: '/privacy' },
              { label: 'Terms of Use',   path: '/terms'   },
            ]},
          ].map(col => (
            <div key={col.title}>
              <div className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#D8F3DC' }}>{col.title}</div>
              {col.links.map(l => (
                <Link key={l.label} to={l.path}
                  className="block text-xs mb-2 hover:opacity-80 transition"
                  style={{ color: '#74C69D', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}

          <div>
            <div className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#D8F3DC' }}>Company</div>
            <Link to="/about" className="block text-xs mb-2 hover:opacity-80 transition" style={{ color: '#74C69D', textDecoration: 'none' }}>
              About WAIZ
            </Link>
            <button
              onClick={() => setShowContact(true)}
              className="block text-xs mb-2 hover:opacity-80 transition text-left"
              style={{ color: '#74C69D', background: 'none', border: 'none', cursor: 'pointer' }}>
              Contact us
            </button>
          </div>

          <div>
            <div className="text-xs font-medium tracking-widest uppercase mb-4"
              style={{ color:'#D8F3DC' }}>Legal</div>
            <button
              onClick={() => setShowPrivacy(true)}
              className="block text-xs mb-2 hover:opacity-80 transition text-left"
              style={{ color:'#74C69D', background:'none', border:'none', cursor:'pointer' }}>
              Privacy Policy
            </button>
            <button
              onClick={() => setShowTerms(true)}
              className="block text-xs mb-2 hover:opacity-80 transition text-left"
              style={{ color:'#74C69D', background:'none', border:'none', cursor:'pointer' }}>
              Terms of Use
            </button>
          </div>
        </div>
        <div className="border-t pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left" style={{ borderColor: '#2D6A4F' }}>
          <span className="text-xs" style={{ color: '#74C69D' }}>© 2025 WAIZ · Baguio City, Philippines</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs hover:opacity-80 transition" style={{ color: '#74C69D', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" className="text-xs hover:opacity-80 transition" style={{ color: '#74C69D', textDecoration: 'none' }}>Terms of Use</Link>
            <span className="text-xs" style={{ color: '#74C69D' }}>Making recycling rewarding for every Baguio home</span>
          </div>
        </div>
      </footer>
          {showContact && <ContactModal onClose={() => setShowContact(false)} />}
          {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
          {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  )
}