import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/config'
import { useAuth } from '../context/AuthContext'

export default function ChooseRole() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [saving,   setSaving]   = useState(false)

  const handleConfirm = async () => {
  if (!selected) return
  setSaving(true)

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) { setSaving(false); return }

  await supabase
    .from('profiles')
    .update({ role: selected })
    .eq('id', currentUser.id)

  if (selected === 'junkshop') {
    await supabase.from('junkshops').upsert({
      id:        currentUser.id,
      shop_name: currentUser.user_metadata?.full_name || 'My Junkshop',
    })
  }

  setSaving(false)
  window.location.href = selected === 'junkshop'
    ? '/dashboard/junkshop'
    : '/dashboard/household'
}

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FEFDF8' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-2xl font-medium tracking-widest mb-2" style={{ color: '#1A4D35' }}>
            WA<span style={{ color: '#C97A3A' }}>I</span>Z
          </div>
          <h1 className="text-xl font-medium text-gray-800">How will you use WAIZ?</h1>
          <p className="text-sm text-gray-400 mt-1">Pick your account type to get started</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            onClick={() => setSelected('household')}
            className="rounded-2xl p-6 text-center cursor-pointer border-2 transition"
            style={{
              borderColor:     selected === 'household' ? '#1A4D35' : '#F3F4F6',
              backgroundColor: selected === 'household' ? '#D8F3DC' : '#fff',
            }}>
            <div className="text-3xl mb-3">🏠</div>
            <div className="text-sm font-medium text-gray-700 mb-1">Household</div>
            <div className="text-xs text-gray-400">Post recyclables and earn cash</div>
          </div>

          <div
            onClick={() => setSelected('junkshop')}
            className="rounded-2xl p-6 text-center cursor-pointer border-2 transition"
            style={{
              borderColor:     selected === 'junkshop' ? '#1A4D35' : '#F3F4F6',
              backgroundColor: selected === 'junkshop' ? '#D8F3DC' : '#fff',
            }}>
            <div className="text-3xl mb-3">🏪</div>
            <div className="text-sm font-medium text-gray-700 mb-1">Junkshop</div>
            <div className="text-xs text-gray-400">Browse and collect recyclables</div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || saving}
          className="w-full py-3 rounded-xl text-sm font-medium text-white transition"
          style={{ backgroundColor: selected ? '#1A4D35' : '#D1FAE5' }}>
          {saving ? 'Setting up your account...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}