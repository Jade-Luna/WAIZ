import { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'
import { useAuth } from '../context/AuthContext'

export default function ContactModal({ onClose }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (profile || user) {
      setForm(prev => ({
        ...prev,
        name:  profile?.full_name || user?.user_metadata?.full_name || '',
        email: user?.email        || '',
      }))
    }
  }, [profile, user])

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSend = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setSending(true)
    setError('')

        console.log('Service ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID)
    console.log('Template ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID)
    console.log('Public Key:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY)
    
    try {
      await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  {
    name:  form.name,
    email: form.email,
    message:    form.message,
  },
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
)
      setSent(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-700 transition"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}>

        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✉️</div>
            <h3 className="text-base font-medium text-gray-800 mb-2">Message sent!</h3>
            <p className="text-sm text-gray-400 mb-5">
              We'll get back to you as soon as possible.
            </p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor:'#1A4D35' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-medium text-gray-800">Contact Support</h3>
                <p className="text-xs text-gray-400 mt-0.5">We usually respond within 24 hours</p>
              </div>
              <button onClick={onClose}
                className="text-gray-300 hover:text-gray-500 transition text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Your name</label>
                <input className={inputClass}
                  placeholder="Juan dela Cruz"
                  value={form.name}
                  onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Your email</label>
                <input className={inputClass} type="email"
                  placeholder="juan@email.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                <textarea className={inputClass + ' resize-none'} rows={4}
                  placeholder="Describe your issue or question..."
                  value={form.message}
                  onChange={e => update('message', e.target.value)} />
              </div>
            </div>

            {error && (
              <p className="text-xs mt-2" style={{ color:'#993C1D' }}>{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSend} disabled={sending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ backgroundColor: sending ? '#52B788' : '#1A4D35' }}>
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}