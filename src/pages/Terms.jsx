import Navigation from '../components/Navigation'

export default function Terms() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFDF8' }}>
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#52B788' }}>Legal</div>
        <h1 className="text-3xl font-medium text-gray-800 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

        {[
          {
            title: 'Acceptance of Terms',
            body: 'By registering and using WAIZ, you agree to these Terms of Use. If you do not agree, please do not use the platform. WAIZ is a marketplace connecting Baguio City households with registered junkshops for the purpose of recycling and waste diversion.'
          },
          {
            title: 'User Accounts',
            body: 'You must provide accurate information when registering. You are responsible for maintaining the security of your account. One person may not create multiple accounts. WAIZ reserves the right to suspend accounts that violate these terms.'
          },
          {
            title: 'Household Rules',
            body: 'Households agree to accurately describe the items they post, including category, estimated weight, and condition. Deliberately misrepresenting items to attract pickup requests is a violation of these terms and may result in account suspension.'
          },
          {
            title: 'Junkshop Rules',
            body: 'Junkshops agree to publish accurate buying rates and honor offers made through the platform. Junkshops must be legitimately operating within Baguio City. WAIZ reserves the right to remove any junkshop that receives consistent negative ratings or complaints.'
          },
          {
            title: 'Prohibited Content',
            body: 'Users may not post items that are illegal, hazardous without proper disclosure, or unrelated to recycling and secondhand goods. WAIZ reserves the right to remove any listing that violates this policy without notice.'
          },
          {
            title: 'Transactions',
            body: 'WAIZ is a platform only. We do not handle payments, guarantee transactions, or take responsibility for disputes between households and junkshops. All financial arrangements are made directly between users.'
          },
          {
            title: 'Ratings and Reviews',
            body: 'Users agree to provide honest ratings based on their actual experience. Ratings may not be manipulated, traded, or submitted by parties who were not involved in the transaction.'
          },
          {
            title: 'Limitation of Liability',
            body: 'WAIZ is provided as-is. We are not liable for any losses, damages, or disputes arising from transactions between users. We do not guarantee the accuracy of listings, rates, or user information.'
          },
          {
            title: 'Changes to Terms',
            body: 'We may update these Terms of Use at any time. Continued use of the platform after changes are posted constitutes acceptance of the new terms.'
          },
          {
            title: 'Contact',
            body: 'For questions about these terms, contact us at supportwaiz@gmail.com.'
          },
        ].map(section => (
          <div key={section.title} className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}