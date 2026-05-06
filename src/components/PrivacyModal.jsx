export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-medium text-gray-800">Privacy Policy</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last updated May 2025</p>
          </div>
          <button onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition text-lg">✕</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 text-sm text-gray-600 leading-relaxed">

          <div>
            <p className="font-medium text-gray-800 mb-1">1. Information We Collect</p>
            <p>We collect information you provide when registering, such as your name, barangay, and role. We also collect listing data, messages, and pickup transaction records you create on the platform.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">2. How We Use Your Information</p>
            <p>Your information is used to operate the WAIZ platform — to show your listings, connect you with junkshops or households, and improve our service. We do not sell your data to third parties.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">3. Location Information</p>
            <p>Your barangay is shown publicly to help junkshops find nearby listings. Your exact address is never shown publicly — it is only shared with a junkshop after you accept their pickup request.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">4. Messages</p>
            <p>Messages sent between users on WAIZ are stored securely to enable communication. We do not read or share your private messages except where required by law.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">5. Data Storage</p>
            <p>Your data is stored securely using Supabase, a trusted cloud database provider. All data is encrypted in transit and at rest.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">6. Third Party Services</p>
            <p>WAIZ uses Google OAuth for sign-in and Supabase for data storage. These services have their own privacy policies which govern their use of your data.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">7. Your Rights</p>
            <p>You may request to view, update, or delete your account data at any time by contacting us. You can also delete your listings and update your profile directly from your dashboard.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">8. Cookies</p>
            <p>WAIZ uses essential cookies to keep you logged in and maintain your session. We do not use tracking or advertising cookies.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">9. Children's Privacy</p>
            <p>WAIZ is not intended for users under 18. We do not knowingly collect data from minors.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">10. Contact</p>
            <p>For privacy concerns, contact us at <a href="mailto:supportwaiz@gmail.com" style={{ color:'#1A4D35' }}>supportwaiz@gmail.com</a></p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor:'#1A4D35' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}