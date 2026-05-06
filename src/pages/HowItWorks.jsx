
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const HOUSEHOLD_STEPS = [
  {
    n: 1,
    title: 'Create account',
    desc:  'Sign up as a household in under 2 minutes. No fees, no credit card — just your name, barangay, and contact number.',
    tip:   'Make sure to select "Household" during signup so junkshops can find your listings.',
    icon:  '👤',
    color: '#D8F3DC',
  },
  {
    n: 2,
    title: 'Post your recyclable item',
    desc:  'Take a photo, choose a category (metal, paper, plastic, e-waste, glass, or secondhand), estimate the weight, and drop your pin in Baguio City.',
    tip:   'Listings with photos and weight estimates get 3x more pickup requests.',
    icon:  '📦',
    color: '#EAF3DE',
  },
  {
    n: 3,
    title: 'Receive pickup requests',
    desc:  'Verified junkshops near you will browse your listing and send pickup requests with their offered price per kilo. Compare offers before accepting.',
    tip:   'You can message the junkshop directly to negotiate or ask questions.',
    icon:  '📬',
    color: '#E6F1FB',
  },
  {
    n: 4,
    title: 'Confirm and get paid',
    desc:  'Accept the best offer, confirm a pickup schedule, hand over your items, and get paid on the spot. Cash on pickup — simple and safe.',
    tip:   'Always rate the junkshop after pickup to help other households make informed choices.',
    icon:  '💰',
    color: '#FAEEDA',
  },
]

const JUNKSHOP_STEPS = [
  {
    n: 1,
    title: 'Register your junkshop',
    desc:  'Sign up as a junkshop and submit a photo of your shop. Our team verifies your account within 24 hours. Verified shops get a trust badge visible to all households.',
    tip:   'Adding your DTI registration number speeds up verification significantly.',
    icon:  '🏪',
    color: '#D8F3DC',
  },
  {
    n: 2,
    title: 'Set your price board',
    desc:  'Publish your buying rates per material — metal, paper, plastic, e-waste, glass, and secondhand. Households compare rates across all junkshops before deciding who picks up.',
    tip:   'Keep your rates updated. Shops with current prices get significantly more requests.',
    icon:  '🏷️',
    color: '#EAF3DE',
  },
  {
    n: 3,
    title: 'Browse available listings',
    desc:  'Filter listings by material category, barangay, and weight. Find items that match what your shop needs and send a pickup request with your offered price.',
    tip:   'Use the map view to plan efficient pickup routes across Baguio barangays.',
    icon:  '🗺️',
    color: '#E6F1FB',
  },
  {
    n: 4,
    title: 'Pick up and grow your volume',
    desc:  'Confirm the pickup schedule with the household, collect the materials, and mark the pickup as done. Build your rating and attract more household suppliers over time.',
    tip:   'Junkshops with 4.5+ ratings receive 2x more listing views from households.',
    icon:  '🚚',
    color: '#FAEEDA',
  },
]

const FAQS = [
  {
    q: 'Is WAIZ free to use?',
    a: 'Completely free for all Baguio City households. Junkshops can register and receive requests for free. Premium features like featured placement in the directory are available for shops that want more visibility.',
  },
  {
    q: 'How does payment work?',
    a: 'Payment is cash on pickup — the junkshop pays the household directly when they collect the items. WAIZ does not handle money or take a commission per transaction.',
  },
  {
    q: 'How do I know if a junkshop is trustworthy?',
    a: 'All junkshops on WAIZ go through a verification process before they can send pickup requests. Verified shops display a green checkmark badge. You can also check their rating and reviews from other households.',
  },
  {
    q: 'What areas does WAIZ cover?',
    a: 'WAIZ currently covers all barangays within Baguio City. We plan to expand to nearby municipalities like La Trinidad, Itogon, and Tuba in future updates.',
  },
  {
    q: 'Can I cancel a pickup request?',
    a: 'Yes — both households and junkshops can cancel a request before it is confirmed. Once a pickup is accepted and scheduled, please communicate directly via the in-app chat if plans change.',
  },
  {
    q: 'What items can I post?',
    a: 'Metal and scrap, paper and cardboard, plastic bottles and containers, e-waste and electronics, glass bottles, and secondhand clothes or appliances. If you are unsure about a specific item, ask ECO — our AI assistant.',
  },
]

export default function HowItWorks() {
  const { user, profile } = useAuth()

  const dashLink = profile?.role === 'junkshop'
    ? '/dashboard/junkshop'
    : '/dashboard/household'

  return (
    <div className="min-h-screen" style={{ backgroundColor:'#FEFDF8' }}>

      {/* NAV */}
      <nav className="w-full h-14 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="text-xl font-medium tracking-widest" style={{ color:'#0D2B1F' }}>
          WA<span style={{ color:'#C97A3A' }}>I</span>Z
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/how-it-works" className="text-sm font-medium" style={{ color:'#1A4D35' }}>
            How It Works
          </Link>
          <Link to="/junkshops" className="text-sm text-gray-500 hover:text-gray-700 transition">
            Junkshops
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          {user ? (
            <Link to={dashLink}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor:'#1A4D35' }}>
              Dashboard
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"
                className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Log in
              </Link>
              <Link to="/signup"
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor:'#1A4D35' }}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="px-8 py-16 text-center" style={{ backgroundColor:'#D8F3DC' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color:'#2D6A4F' }}>
            How WAIZ Works
          </div>
          <h1 className="text-4xl font-medium mb-4" style={{ color:'#0D2B1F' }}>
            Recycling made simple for Baguio City
          </h1>
          <p className="text-sm leading-relaxed" style={{ color:'#2D6A4F' }}>
            WAIZ connects households that have recyclables with verified junkshops that want to buy them.
            No middlemen, no hidden fees — just a cleaner, greener Baguio.
          </p>
        </div>
      </section>

      {/* STEPS — HOUSEHOLD */}
      <section className="px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor:'#D8F3DC' }}>🏠</div>
            <div>
              <h2 className="text-2xl font-medium text-gray-800">For Households</h2>
              <p className="text-sm text-gray-400 mt-0.5">Turn your scrap into cash in four simple steps</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {HOUSEHOLD_STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {i < HOUSEHOLD_STEPS.length - 1 && (
                  <div className="absolute top-8 left-full w-5 h-px z-10 hidden lg:block"
                    style={{ backgroundColor:'#B7E4C7' }} />
                )}
                <div className="rounded-2xl p-5 h-full"
                  style={{ backgroundColor: step.color }}>
                  <div className="text-2xl mb-3">{step.icon}</div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white mb-3"
                    style={{ backgroundColor:'#1A4D35' }}>
                    {step.n}
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-500 mb-3">{step.desc}</p>
                  <div className="text-xs p-2.5 rounded-xl"
                    style={{ backgroundColor:'rgba(255,255,255,0.6)', color:'#1A4D35' }}>
                    💡 {step.tip}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/signup"
              className="inline-block px-6 py-3 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor:'#1A4D35' }}>
              Sign up as a Household
            </Link>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px mx-8" style={{ backgroundColor:'#E5E7EB' }} />

      {/* STEPS — JUNKSHOP */}
      <section className="px-8 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor:'#FAEEDA' }}>🏪</div>
            <div>
              <h2 className="text-2xl font-medium text-gray-800">For Junkshops</h2>
              <p className="text-sm text-gray-400 mt-0.5">Find more suppliers and grow your collection volume</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {JUNKSHOP_STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {i < JUNKSHOP_STEPS.length - 1 && (
                  <div className="absolute top-8 left-full w-5 h-px z-10 hidden lg:block"
                    style={{ backgroundColor:'#FAC775' }} />
                )}
                <div className="rounded-2xl p-5 h-full"
                  style={{ backgroundColor: step.color }}>
                  <div className="text-2xl mb-3">{step.icon}</div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white mb-3"
                    style={{ backgroundColor:'#C97A3A' }}>
                    {step.n}
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-500 mb-3">{step.desc}</p>
                  <div className="text-xs p-2.5 rounded-xl"
                    style={{ backgroundColor:'rgba(255,255,255,0.6)', color:'#C97A3A' }}>
                    💡 {step.tip}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/signup"
              className="inline-block px-6 py-3 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor:'#C97A3A' }}>
              Register your Junkshop
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-8 py-16" style={{ backgroundColor:'#FEFDF8' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color:'#52B788' }}>
              FAQ
            </div>
            <h2 className="text-2xl font-medium text-gray-800">Common questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-16" style={{ backgroundColor:'#D8F3DC' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-medium mb-3" style={{ color:'#0D2B1F' }}>
            Ready to get started?
          </h2>
          <p className="text-sm mb-6" style={{ color:'#2D6A4F' }}>
            Join hundreds of Baguio households and junkshops already using WAIZ.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/signup"
              className="px-6 py-3 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor:'#1A4D35' }}>
              Create account
            </Link>
            <Link to="/"
              className="px-6 py-3 rounded-xl text-sm font-medium border"
              style={{ borderColor:'#1A4D35', color:'#1A4D35' }}>
              Back to home
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor:'#1B4332' }} className="px-8 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-lg font-medium tracking-widest" style={{ color:'#D8F3DC' }}>
            WA<span style={{ color:'#C97A3A' }}>I</span>Z
          </div>
          <span className="text-xs" style={{ color:'#74C69D' }}>
            © 2025 WAIZ · Baguio City, Philippines
          </span>
        </div>
      </footer>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-medium text-gray-700">{q}</span>
        <span className="text-gray-400 shrink-0 ml-4 transition-transform"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm leading-relaxed text-gray-500 border-t border-gray-50 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}