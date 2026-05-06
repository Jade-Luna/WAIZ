// @refresh reset
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/config'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
  try {
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // New Google user — no profile yet, create one
    if (!data) {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
     const { data: newProfile } = await supabase
  .from('profiles')
  .upsert({
    id:        userId,
    full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0],
    role:      null,
  }, { onConflict: 'id', ignoreDuplicates: true })
  .select()
  .single()
      data = newProfile
    }

    setProfile(data || null)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    // Get initial session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}