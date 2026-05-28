import Navigation from '../components/Navigation'

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFDF8' }}>
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#52B788' }}>Legal</div>
        <h1 className="text-3xl font-medium text-gray-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

        {[
          {
            title: 'Information We Collect',
            body: 'We collect information you provide when registering, including your name, email address, barangay, and phone number. We also collect information about listings you post, pickups you request, and messages you send through the platform.'
          },
          {
            title: 'How We Use Your Information',
            body: 'Your information is used to operate the WAIZ marketplace, connect households with junkshops, process pickup requests, and send platform notifications. We do not sell your personal information to third parties.'
          },
          {
            title: 'Information Sharing',
            body: 'Your name and barangay are visible to other registered users on the platform. Your contact details are only shared with junkshops you have an active pickup arrangement with. Junkshop information including shop name, barangay, and buying rates are publicly visible.'
          },
          {
            title: 'Data Storage',
            body: 'Your data is stored securely using Supabase, a trusted cloud database provider. We use industry-standard security practices to protect your information from unauthorized access.'
          },
          {
            title: 'Cookies',
            body: 'WAIZ uses cookies and local storage to keep you logged in and remember your preferences. We do not use cookies for advertising or tracking across other websites.'
          },
          {
            title: 'Your Rights',
            body: 'You may request to view, update, or delete your account and associated data at any time by contacting us at supportwaiz@gmail.com. We will process your request within 7 business days.'
          },
          {
            title: 'Changes to This Policy',
            body: 'We may update this Privacy Policy from time to time. We will notify registered users of significant changes through the platform messaging system.'
          },
          {
            title: 'Contact Us',
            body: 'If you have questions about this Privacy Policy, please contact us at supportwaiz@gmail.com or through the Contact page on the WAIZ website.'
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