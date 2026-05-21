// src/hooks/useTour.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase/config'

const TOUR_STEPS = {
  household: [
    {
      target: null,
      position: 'center',
      title: "Welcome to WAIZ! 🌿",
      msg: "I'm ECO — your WAIZ buddy! Let me give you a quick tour of your dashboard so you can start turning household junk into cash. It'll take less than 2 minutes!",
    },
    {
      target: '[data-tour="sidebar"]',
      position: 'right',
      title: "Your Navigation",
      msg: "This sidebar is your home base. Switch between My Listings, Pickup Requests, History, Messages, and your Profile from here.",
    },
    {
      target: '[data-tour="stat-cards"]',
      position: 'bottom',
      title: "Track Your Earnings",
      msg: "These cards show your active listings, pending pickups, completed sales, and total earnings. Right now they're at zero — but not for long!",
    },
    {
      target: '[data-tour="nav-requests"]',
      position: 'right',
      title: "Pickup Requests",
      msg: "When a junkshop wants to buy your item, their request shows up here. You'll be able to accept or decline offers directly from this tab.",
    },
    {
  target: '[data-tour="nav-map"]',
  position: 'right',
  title: "Find Nearby Junkshops 📍",
  msg: "Browse junkshops in Baguio, see their buying rates, and find one near your barangay. Use this tab to explore the map anytime!",
},
    {
      target: '[data-tour="post-btn"]',
      position: 'bottom',
      title: "Post Your First Item",
      msg: "Ready to earn? Click here to post a listing — snap a photo, describe your scrap (bottles, newspapers, metals), set a weight estimate, and wait for bids!",
    },
    {
      target: null,
      position: 'center',
      isFinal: true,
      title: "You're all set, eco-hero! 🎉",
      msg: "That's the full tour! Post your first item — old newspapers, bottles, scrap metal — anything recyclable has value here. Your wallet and the planet will both thank you! ♻️",
    },
  ],

  junkshop: [
  {
    target: null,
    position: 'center',
    title: "Welcome to WAIZ, Partner! 🏭",
    msg: "Great to have you aboard! WAIZ connects your junkshop directly with Baguio households selling recyclables. I'll show you how it all works — no more sourcing headaches!",
  },
  {
    target: '[data-tour="sidebar"]',
    position: 'right',
    title: "Your Business Dashboard",
    msg: "This sidebar connects you to everything: Pickup Requests, Active Pickups, History, Messages, your Rate Board, and Shop Profile.",
  },
  {
    target: '[data-tour="stat-cards"]',
    position: 'bottom',
    title: "Your Business at a Glance",
    msg: "Here you'll track pending requests, active pickups, completed pickups, and total paid to households — all updated in real time.",
  },
  {
    target: '[data-tour="nav-requests"]',
    position: 'right',
    title: "Pickup Requests 📬",
    msg: "This is your main pipeline. When a household lists an item, you can send a pickup request and price offer. All incoming requests land here.",
  },
  {
    target: '[data-tour="nav-priceboard"]',
    position: 'right',
    title: "Your Rate Board 💰",
    msg: "Set your buying prices per kilo for each material type. Households can see your rates publicly — competitive pricing means more pickups!",
  },
  {
    target: '[data-tour="nav-messages"]',
    position: 'right',
    title: "Messages 💬",
    msg: "Chat directly with households to coordinate pickups, confirm details, or negotiate. All in one place — no need for separate apps.",
  },
  {
    target: null,
    position: 'center',
    isFinal: true,
    title: "Your junkshop just got smarter! 🎉",
    msg: "You're ready to source recyclables through WAIZ! Head to Pickup Requests to see what's available in your area today. ECO will be here if you need anything! ♻️",
  },
],
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTour({ user, profile }) {
  const [tourActive,  setTourActive]  = useState(false)
  const [tourIndex,   setTourIndex]   = useState(0)
  const [tourWaiting, setTourWaiting] = useState(false)
  const [showDone,    setShowDone]    = useState(false)
  const [checking,    setChecking]    = useState(true)

  // Keep a ref so callbacks always see the latest values without re-creating
  const stateRef = useRef({})
  stateRef.current = { tourActive, tourIndex, tourWaiting }

  const role  = profile?.role
  const steps = role ? (TOUR_STEPS[role] || []) : []
  const step  = steps[tourIndex] || null

  // ── Check first-time ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !profile) return
    if (profile.tour_completed) { setChecking(false); return }
    const lsKey = `waiz_tour_done_${user.id}`
    if (localStorage.getItem(lsKey)) { setChecking(false); return }
    setTourActive(true)
    setChecking(false)
  }, [user?.id, profile?.tour_completed])

  // ── Internal navigate to step ────────────────────────────────────────────
  const goTo = useCallback((idx, currentSteps) => {
    const s = currentSteps[idx]
    if (!s) return
    if (s.isFinal) {
      setTourActive(false)
      setShowDone(true)
      markDone(user)
      return
    }
    setTourIndex(idx)
    setTourWaiting(s.action === 'click')
  }, [user])

  const next = useCallback(() => {
    const { tourWaiting: w, tourIndex: i } = stateRef.current
    if (w) return
    goTo(i + 1, steps)
  }, [goTo, steps])

  const back = useCallback(() => {
    const { tourIndex: i } = stateRef.current
    if (i <= 0) return
    goTo(i - 1, steps)
  }, [goTo, steps])

  const skip = useCallback(() => {
    setTourActive(false)
    setTourWaiting(false)
    markDone(user)
  }, [user])

  // ── completeAction ───────────────────────────────────────────────────────
  // Called by DashboardLayout when the user clicks the required nav item.
  // We immediately unblock (setTourWaiting false) so the UI updates,
  // then advance after a short delay — navigation happens naturally via
  // the Link component, we just don't prevent it.
  const completeAction = useCallback(() => {
    const { tourWaiting: w, tourIndex: i } = stateRef.current
    if (!w) return
    setTourWaiting(false)
    setTimeout(() => goTo(i + 1, steps), 700)
  }, [goTo, steps])

  const closeDone  = useCallback(() => setShowDone(false), [])

  const resetTour = useCallback(() => {
    if (user) localStorage.removeItem(`waiz_tour_done_${user.id}`)
    setShowDone(false)
    setTourIndex(0)
    setTourWaiting(false)
    setTourActive(true)
  }, [user])

  return {
    tourActive, tourIndex, tourWaiting,
    showDone, step, steps, role,
    next, back, skip, completeAction, closeDone, resetTour, checking,
  }
}

// ── Persist completion (outside hook to avoid stale closure) ─────────────────
async function markDone(user) {
  if (!user) return
  localStorage.setItem(`waiz_tour_done_${user.id}`, '1')
  try {
    await supabase.from('profiles').update({ tour_completed: true }).eq('id', user.id)
  } catch (_) { /* column optional */ }
}