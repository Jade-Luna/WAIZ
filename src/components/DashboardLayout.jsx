// src/components/DashboardLayout.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import { useTour } from '../hooks/useTour'
import TourOverlay from './TourOverlay'

export default function DashboardLayout({ children, activeTab }) {
  const { profile, signOut, user } = useAuth()
  const navigate    = useNavigate()
  const isJunk      = profile?.role === 'junkshop'
  const [collapsed, setCollapsed] = useState(false)
  const [showMobileMore, setShowMobileMore] = useState(false)

  // ── Tour ──────────────────────────────────────────────────────────────────
  const tour = useTour({ user, profile })

  // Called on every nav-item click.
  // If the tour is waiting for THIS item to be clicked:
  //   1. Prevent the Link from navigating immediately
  //   2. Complete the tour action (advances tooltip after 700 ms)
  //   3. Navigate to the path ourselves after the same delay so the
  //      user sees the tooltip update before the page changes
  const handleNavClick = (e, itemKey, itemPath) => {
    if (tour.tourWaiting && tour.step?.actionTarget === itemKey) {
      e.preventDefault()
      tour.completeAction()
      setTimeout(() => navigate(itemPath), 700)
    }
    // Otherwise: let the Link navigate normally
  }

  const HOUSEHOLD_NAV = [
    { key:'listings',  label:'My Listings',      icon:<ListIcon />,     path:'/dashboard/household'                },
    { key:'requests',  label:'Pickup Requests',   icon:<TruckIcon />,   path:'/dashboard/household?tab=requests'   },
    { key:'calendar',  label:'Calendar',          icon:<CalendarIcon />,path:'/dashboard/household?tab=calendar'   },
    { key:'history',   label:'Pickup History',    icon:<ClockIcon />,   path:'/dashboard/household?tab=history'    },
    { key:'messages',  label:'Messages',          icon:<ChatIcon />,    path:'/dashboard/household?tab=messages'   },
    { key:'map',       label:'Nearby Junkshops',  icon:<MapPinIcon />,  path:'/dashboard/household?tab=map'        },
    { key:'profile',   label:'Profile',           icon:<UserIcon />,    path:'/dashboard/household?tab=profile'    },
  ]

  const JUNKSHOP_NAV = [
    { key:'requests',   label:'Pickup Requests', icon:<TruckIcon />,    path:'/dashboard/junkshop'                  },
    { key:'accepted',   label:'Active Pickups',  icon:<BoxIcon />,      path:'/dashboard/junkshop?tab=accepted'     },
    { key:'calendar',   label:'Calendar',        icon:<CalendarIcon />, path:'/dashboard/junkshop?tab=calendar'     },
    { key:'history',    label:'History',         icon:<ClockIcon />,    path:'/dashboard/junkshop?tab=history'      },
    { key:'messages',   label:'Messages',        icon:<ChatIcon />,     path:'/dashboard/junkshop?tab=messages'     },
    { key:'priceboard', label:'Rate Board',      icon:<TagIcon />,      path:'/dashboard/junkshop?tab=priceboard'   },
    { key:'profile',    label:'Shop Profile',    icon:<UserIcon />,     path:'/dashboard/junkshop?tab=profile'      },
  ]

  const NAV = isJunk ? JUNKSHOP_NAV : HOUSEHOLD_NAV
  const [unreadMessages,  setUnreadMessages]  = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event:'*', schema:'public', table:'messages',
          filter:`receiver_id=eq.${user.id}` }, () => fetchNotifications())
      .on('postgres_changes', { event:'*', schema:'public', table:'pickups' },
          () => fetchNotifications())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  useEffect(() => {
    if (!user || activeTab !== 'messages') return
    supabase.from('messages').update({ is_read: true })
      .eq('receiver_id', user.id).eq('is_read', false)
      .then(() => fetchNotifications())
  }, [activeTab, user])

  const fetchNotifications = async () => {
    if (!user) return
    const { count: msgCount } = await supabase
      .from('messages').select('*', { count:'exact', head:true })
      .eq('receiver_id', user.id).eq('is_read', false)
    setUnreadMessages(msgCount || 0)

    if (isJunk) {
      const { count: reqCount } = await supabase
        .from('pickups').select('*', { count:'exact', head:true })
        .eq('junkshop_id', user.id).eq('status', 'requested')
      setPendingRequests(reqCount || 0)
    } else {
      const { count: reqCount } = await supabase
        .from('pickups').select('*', { count:'exact', head:true })
        .eq('household_id', user.id).in('status', ['requested', 'offered'])
      setPendingRequests(reqCount || 0)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex w-full" style={{ backgroundColor:'#FEFDF8', minHeight: '100vh' }}>

      <style>{`
        @keyframes eco-spark-dot {
          0%, 100% { opacity:1; transform:scale(1);   }
          50%       { opacity:0.4; transform:scale(0.6); }
        }
        .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
        .hide-scrollbar::-webkit-scrollbar { display:none; }
        @media (max-width: 768px) {
          .sidebar { display:none; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>

      {/* ══ SIDEBAR (Desktop only) ════════════════════════════════════════════ */}
      <aside
  className="sidebar flex flex-col shrink-0 transition-all duration-200"
  data-tour="sidebar"
        style={{
          width:    collapsed ? '64px' : '220px',
          minWidth: collapsed ? '64px' : '220px',
          backgroundColor:'#0D2B1F',
          position:'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: tour.tourActive && tour.step?.target === '[data-tour="sidebar"]' ? 9920 : 30,
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b"
          style={{ borderColor:'#1A4D35' }}>
          {!collapsed && (
            <Link to="/" className="font-bold tracking-tighter"
              style={{ color:'#D8F3DC', letterSpacing:'-0.03em', fontSize:18, fontWeight:800 }}>
              WA<span style={{ color:'#C97A3A' }}>I</span>Z
            </Link>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg"
            style={{ color:'#52B788', marginLeft: collapsed ? 'auto' : 0 }}>
            {collapsed ? <MenuOpenIcon /> : <MenuCloseIcon />}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="px-4 py-4 border-b" style={{ borderColor:'#1A4D35' }}>
            <div className="w-9 h-9 rounded-xl overflow-hidden mb-2 flex items-center justify-center text-sm font-medium"
              style={{ backgroundColor:'#1A4D35', color:'#B7E4C7' }}>
              {profile?.avatar_url || profile?.photo_url
                ? <img src={profile.avatar_url || profile.photo_url} alt="avatar" className="w-full h-full object-cover" />
                : profile?.full_name?.slice(0,2).toUpperCase() || 'U'
              }
            </div>
            <div className="text-sm font-bold truncate" style={{ color:'#D8F3DC', fontWeight:700 }}>
              {profile?.full_name || 'User'}
            </div>
            <div className="text-xs mt-1.5"
              style={{ color:'#52B788', fontWeight:500, fontSize:12, letterSpacing:'0.02em' }}>
              {isJunk ? 'Junkshop' : 'Household'} · {profile?.barangay?.split('-')[0] || 'Baguio'}
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(item => {
            const isActive     = activeTab === item.key
            const isTourTarget = tour.tourActive &&
              tour.step?.target === `[data-tour="nav-${item.key}"]`
            const dotCount = item.key === 'messages' ? unreadMessages
              : item.key === 'requests' ? pendingRequests : 0

            return (
              <Link
                key={item.key}
                to={item.path}
                data-tour={`nav-${item.key}`}
                onClick={e => handleNavClick(e, item.key, item.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm"
                style={{
                  backgroundColor: isActive ? '#C97A3A' : 'transparent',
                  color:           isActive ? '#fff'    : '#74C69D',
                  fontWeight:      isActive ? '700'     : '600',
                  fontSize:        13,
                  letterSpacing:   isActive ? '-0.01em' : '0.015em',
                  position:        'relative',
                  // Lift this nav item above spotlight when it's the target
                  zIndex:          isTourTarget ? 9920 : 'auto',
                  transition:      'all 0.15s ease',
                }}
              >
                <span className="shrink-0 relative" style={{ color: isActive ? '#fff' : '#52B788' }}>
                  {item.icon}
                  {dotCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor:'#C97A3A', fontSize:8, fontWeight:700,
                        animation:'eco-spark-dot 1.5s ease-in-out infinite' }}>
                      {dotCount > 9 ? '9+' : dotCount}
                    </span>
                  )}
                </span>
                {!collapsed && (
                  <span className="truncate" style={{ fontWeight: isActive ? '700' : '600' }}>
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-2 py-3 border-t space-y-0.5" style={{ borderColor:'#1A4D35' }}>
          <Link to="/browse"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
            style={{ color:'#74C69D', fontWeight:600, fontSize:13 }}>
            <span style={{ color:'#52B788' }}><BrowseIcon /></span>
            {!collapsed && <span>Marketplace</span>}
          </Link>
          <button onClick={() => setShowSignOutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
            style={{ color:'#74C69D', fontWeight:600, fontSize:13 }}>
            <span style={{ color:'#52B788' }}><SignOutIcon /></span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 flex flex-col main-content"
  style={{
    marginLeft: collapsed ? '64px' : '220px',
    transition: 'margin-left 0.2s ease',
  }}>
        {/* Top bar */}
        <div className="h-14 md:h-14 flex items-center justify-between px-4 md:px-8 bg-white border-b border-gray-100 shrink-0 z-30">
          <div className="text-sm md:text-base font-bold"
            style={{ color:'#1f2937', letterSpacing:'-0.02em', fontWeight:800 }}>
            {NAV.find(n => n.key === activeTab)?.label || 'Dashboard'}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-4 md:p-8 pb-24 md:pb-8">
            {/* data-tour="stat-cards" wraps children so the spotlight can
                highlight the stat grid at the top of each dashboard */}
            <div data-tour="stat-cards">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile bottom nav - Cute icons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-50"
          style={{ boxShadow:'0 -2px 8px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-around">
            {NAV.map((item, idx) => {
              if (idx >= 4) return null
              const isActive = activeTab === item.key
              const dotCount = item.key === 'messages' ? unreadMessages
                : item.key === 'requests' ? pendingRequests : 0

              return (
                <Link key={item.key} to={item.path}
                  onClick={e => handleNavClick(e, item.key, item.path)}
                  data-tour={`nav-${item.key}`}
                  className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition"
                  style={{
                    color: isActive ? '#1A4D35' : '#9CA3AF',
                    fontSize: 11,
                    fontWeight: isActive ? '700' : '500',
                    borderTop: isActive ? '3px solid #1A4D35' : 'none',
                    paddingTop: isActive ? '6px' : '12px'
                  }}>
                  <span style={{ color: isActive ? '#1A4D35' : '#52B788', position:'relative', display:'inline-flex' }}>
                    {item.icon}
                    {dotCount > 0 && (
                      <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                        style={{
                          backgroundColor:'#C97A3A',
                          fontSize:7,
                          fontWeight:700,
                          animation:'eco-spark-dot 1.5s ease-in-out infinite'
                        }}>
                        {dotCount > 9 ? '9+' : dotCount}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize:10 }}>{item.label.split(' ')[0]}</span>
                </Link>
              )
            })}

            {/* More menu */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative"
              style={{ cursor:'pointer' }}>
              <button
                onClick={() => setShowMobileMore(!showMobileMore)}
                className="flex items-center justify-center transition"
                style={{
                  color: showMobileMore ? '#1A4D35' : '#52B788',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <MoreIcon />
              </button>
              <span style={{ fontSize:10, color: showMobileMore ? '#1A4D35' : '#9CA3AF' }}>More</span>

              {showMobileMore && (
                <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-100 rounded-t-2xl p-3 mb-1"
                  style={{ boxShadow:'0 -4px 12px rgba(0,0,0,0.1)' }}>
                  <div className="grid grid-cols-2 gap-2">
                    {NAV.slice(4).map(item => {
                      const isActive = activeTab === item.key
                      const dotCount = item.key === 'messages' ? unreadMessages
                        : item.key === 'requests' ? pendingRequests : 0

                      return (
                        <Link key={item.key} to={item.path}
                          onClick={(e) => {
                            handleNavClick(e, item.key, item.path)
                            setShowMobileMore(false)
                          }}
                          data-tour={`nav-${item.key}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm"
                          style={{
                            backgroundColor: isActive ? '#E8F5E9' : '#F9FAFB',
                            color: isActive ? '#1A4D35' : '#6B7280',
                            fontWeight: isActive ? '700' : '600',
                            textDecoration: 'none',
                            position: 'relative'
                          }}>
                          <span style={{ color: isActive ? '#1A4D35' : '#52B788', position:'relative', display:'inline-flex' }}>
                            {item.icon}
                            {dotCount > 0 && (
                              <span className="absolute -top-1 -right-2 w-3 h-3 rounded-full flex items-center justify-center text-white"
                                style={{
                                  backgroundColor:'#C97A3A',
                                  fontSize:6,
                                  fontWeight:700,
                                  animation:'eco-spark-dot 1.5s ease-in-out infinite'
                                }}>
                                {dotCount > 9 ? '9+' : dotCount}
                              </span>
                            )}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}

                    {/* Mobile menu - Browse & Sign out */}
                    <Link to="/browse"
                      onClick={() => setShowMobileMore(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor:'#F9FAFB', color:'#6B7280', fontWeight:600, textDecoration:'none' }}>
                      <span style={{ color:'#52B788' }}><BrowseIcon /></span>
                      <span>Browse</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowMobileMore(false)
                        setShowSignOutModal(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor:'#F9FAFB', color:'#6B7280', fontWeight:600, border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
                      <span style={{ color:'#52B788' }}><SignOutIcon /></span>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sign-out modal */}
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
            onClick={() => setShowSignOutModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <h3 className="text-base font-medium text-gray-800 mb-1">Sign out of WAIZ?</h3>
                <p className="text-sm text-gray-400">You'll need to sign back in to access your dashboard.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500">
                  Cancel
                </button>
                <button onClick={handleSignOut}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor:'#1A4D35' }}>
                  Yes, sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══ TOUR OVERLAY ═════════════════════════════════════════════════════ */}
      <TourOverlay
        tourActive={tour.tourActive}
        showDone={tour.showDone}
        step={tour.step}
        steps={tour.steps}
        tourIndex={tour.tourIndex}
        tourWaiting={tour.tourWaiting}
        role={tour.role}
        next={tour.next}
        back={tour.back}
        skip={tour.skip}
        closeDone={tour.closeDone}
        resetTour={tour.resetTour}
      />
    </div>
  )
}

function ListIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg> }
function TruckIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> }
function ChatIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function ClockIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function MapPinIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> }
function UserIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function BoxIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> }
function TagIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function BrowseIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function SignOutIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function MenuCloseIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function MenuOpenIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function MoreIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg> }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }