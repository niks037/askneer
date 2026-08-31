export default function TermsOfService() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Segoe UI', sans-serif", color: "#2D2D2D", lineHeight: 1.8 }}>

      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ color: "#E07A5F", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to AskNeer</a>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Terms of Service</h1>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 40 }}>Last updated: August 2026</p>

      <div style={{ background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 12, padding: "16px 20px", marginBottom: 40 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#993C1D", lineHeight: 1.6 }}>
          <strong>Medical Disclaimer:</strong> AskNeer is not a medical service and does not provide medical advice. All content is for general informational and parenting guidance purposes only. Never disregard professional medical advice or delay seeking it because of something AskNeer has told you. In case of a medical emergency, call your local emergency services immediately.
        </p>
      </div>

      {[
        {
          title: "1. Acceptance of terms",
          content: `By accessing or using AskNeer at askneer.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use AskNeer.

These terms apply to all users of AskNeer, including free and Pro subscribers. We may update these terms from time to time. Continued use of AskNeer after changes constitutes acceptance.`
        },
        {
          title: "2. Description of service",
          content: `AskNeer is an AI-powered parenting companion app that provides personalized parenting information and guidance. AskNeer uses artificial intelligence to answer parenting questions, track vaccination schedules, and remember information about your child.

AskNeer is operated by Rajwinder Kaur, an individual based in India, powered by the NeernMom parenting brand.`
        },
        {
          title: "3. Not medical advice",
          content: `AskNeer provides general parenting information only. Nothing on AskNeer constitutes:

- Medical advice, diagnosis, or treatment
- Professional healthcare guidance
- A substitute for consultation with a qualified doctor, pediatrician, or healthcare provider
- Legal or psychological advice

Always consult a qualified healthcare professional before making any health-related decisions for your child. AskNeer is not liable for any actions taken based on information provided by the app.`
        },
        {
          title: "4. Eligibility",
          content: `You must be at least 18 years old to use AskNeer. By using AskNeer, you confirm that you are 18 or older and are the parent or legal guardian of any child whose information you enter into the app.

AskNeer is not intended for use by children. If you are under 18, please do not use this service.`
        },
        {
          title: "5. User accounts",
          content: `You sign in to AskNeer using your Google account. You are responsible for maintaining the security of your account and all activity that occurs under your account.

You agree to provide accurate information when setting up your child's profile. You must not use AskNeer for any unlawful purpose or in violation of these terms.`
        },
        {
          title: "6. Subscription and payments",
          content: `AskNeer offers a free tier with 3 questions per day and a Pro subscription at $4.99 per month.

Pro subscriptions include a 7-day free trial. Your payment method will be charged at the end of the trial period unless you cancel before the trial ends.

Subscriptions automatically renew monthly. You can cancel at any time through the Manage Plan option in the app. Cancellation takes effect at the end of the current billing period.

Payments are processed by Dodo Payments. We do not store your payment card information.

Refunds are handled on a case-by-case basis. Contact info@askneer.com within 7 days of a charge if you believe you were charged in error.`
        },
        {
          title: "7. Acceptable use",
          content: `You agree not to:

- Use AskNeer for any unlawful purpose
- Attempt to reverse engineer, hack, or compromise the app
- Share your account with others
- Use AskNeer to generate harmful, abusive, or inappropriate content
- Misrepresent yourself or your relationship to any child
- Use AskNeer in any way that could harm children

We reserve the right to suspend or terminate accounts that violate these terms.`
        },
        {
          title: "8. AI limitations",
          content: `AskNeer uses artificial intelligence to generate responses. AI responses may be inaccurate, incomplete, or out of date. We do not guarantee the accuracy of any information provided by AskNeer.

You should independently verify any important information, particularly any health or medical information, with a qualified professional. AskNeer is not responsible for decisions made based on AI-generated content.`
        },
        {
          title: "9. Intellectual property",
          content: `All content, design, and technology on AskNeer is owned by or licensed to Rajwinder Kaur / AskNeer. You may not copy, reproduce, or distribute any part of AskNeer without prior written permission.

Content you enter into AskNeer (messages, child profiles) remains yours. You grant AskNeer a limited license to process this content solely to provide the service to you.`
        },
        {
          title: "10. Limitation of liability",
          content: `To the maximum extent permitted by law, AskNeer and its operator are not liable for:

- Any indirect, incidental, or consequential damages
- Any decisions made based on AskNeer's AI responses
- Any health outcomes related to information provided by the app
- Any loss of data or service interruptions
- Any damages exceeding the amount you paid to AskNeer in the past 12 months

AskNeer is provided "as is" without warranties of any kind, express or implied.`
        },
        {
          title: "11. Privacy",
          content: `Your use of AskNeer is governed by our Privacy Policy at askneer.com/privacy. By using AskNeer, you consent to our data practices as described in the Privacy Policy.`
        },
        {
          title: "12. Governing law",
          content: `These terms are governed by the laws of India. Any disputes arising from these terms or your use of AskNeer shall be subject to the jurisdiction of courts in India.

For users in the United States, United Kingdom, or Philippines, local consumer protection laws may also apply.`
        },
        {
          title: "13. Contact us",
          content: `If you have any questions about these Terms of Service, please contact us at:

Email: info@askneer.com
Website: www.askneer.com`
        }
      ].map(section => (
        <div key={section.title} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#2D2D2D" }}>{section.title}</h2>
          <p style={{ fontSize: 15, color: "#444", whiteSpace: "pre-line", margin: 0 }}>{section.content}</p>
        </div>
      ))}

      <div style={{ borderTop: "1px solid #F0EDED", paddingTop: 24, marginTop: 40 }}>
        <p style={{ fontSize: 13, color: "#aaa" }}>
          © 2026 AskNeer · Powered by NeernMom ·{" "}
          <a href="/privacy" style={{ color: "#E07A5F" }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}