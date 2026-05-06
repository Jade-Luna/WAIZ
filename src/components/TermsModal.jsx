export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-medium text-gray-800">Terms of Use</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last updated May 2025</p>
          </div>
          <button onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition text-lg">✕</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 text-sm text-gray-600 leading-relaxed">

          <div>
            <p className="font-medium text-gray-800 mb-1">1. Acceptance of Terms</p>
            <p>By accessing or using WAIZ, you agree to be bound by these Terms of Use. If you do not agree, please do not use the platform.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">2. Who Can Use WAIZ</p>
            <p>WAIZ is available to residents and registered junkshops within Baguio City, Philippines. You must be at least 18 years old or have parental consent to use this platform.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">3. User Accounts</p>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information when registering and to keep your profile up to date.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">4. Listings and Transactions</p>
            <p>WAIZ is a marketplace platform only. We do not guarantee the quality, safety, or legality of any items posted. All transactions are between households and junkshops directly. WAIZ is not a party to any transaction.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">5. Prohibited Conduct</p>
            <p>You agree not to post false, misleading, or harmful content. You must not use WAIZ for any illegal activity, harassment, or spam. Violations may result in account suspension.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">6. Pickup Agreements</p>
            <p>Once a pickup request is accepted by a household, both parties are expected to honor the agreed schedule and price. WAIZ is not liable for any disputes arising from failed or incomplete pickups.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">7. Intellectual Property</p>
            <p>All content, branding, and design on WAIZ are owned by the WAIZ team. You may not reproduce or distribute any part of the platform without written permission.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">8. Limitation of Liability</p>
            <p>WAIZ is provided as-is. We are not liable for any damages, losses, or disputes arising from the use of this platform. Use WAIZ at your own discretion.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">9. Changes to Terms</p>
            <p>We may update these terms at any time. Continued use of WAIZ after changes means you accept the updated terms.</p>
          </div>

          <div>
            <p className="font-medium text-gray-800 mb-1">10. Contact</p>
            <p>For questions about these terms, contact us at <a href="mailto:supportwaiz@gmail.com" style={{ color:'#1A4D35' }}>supportwaiz@gmail.com</a></p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor:'#1A4D35' }}>
            I understand
          </button>
        </div>
      </div>
    </div>
  )
}