export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Segoe UI', sans-serif", color: "#2D2D2D", lineHeight: 1.8 }}>

      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ color: "#E07A5F", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to AskNeer</a>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Privacy Policy</h1>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 40 }}>Last updated: September 2026</p>

      <div style={{ background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 12, padding: "16px 20px", marginBottom: 40 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#993C1D", lineHeight: 1.6 }}>
          <strong>Important:</strong> AskNeer is not a medical service. The information provided by AskNeer is for general parenting guidance only and does not constitute medical advice. Always consult a qualified healthcare professional for medical decisions.
        </p>
      </div>

      {[
        {
          title: "1. Who we are",
          content: `AskNeer (askneer.com) is an AI-powered parenting companion app operated by Rajwinder Kaur, an individual based in India. AskNeer is powered by NeernMom, a parenting content brand. You can contact us at info@askneer.com.`
        },
        {
          title: "2. What information we collect",
          content: `We collect the following information when you use AskNeer:

- Google account information (name, email address) when you sign in with Google
- Child profile information you provide (child's name, date of birth, optional notes such as allergies or health conditions)
- Chat messages and conversations you have with AskNeer
- Facts and memories extracted from your conversations (such as allergies, milestones, and activities)
- Vaccination tracking data you enter
- Daily check-in data (mood, sleep quality, optional notes)
- Sleep Coach data (bedtime, wake time, nap times, sleep plans)
- Payment information (processed securely by Dodo Payments - we never see your card details)
- Device information and usage data for app performance`
        },
        {
          title: "3. How we use your information",
          content: `We use your information to:

- Provide personalized AI parenting guidance tailored to your child
- Remember important facts about your child across sessions
- Calculate and display your child's vaccine schedule
- Generate personalized sleep plans through Sleep Coach
- Track your child's daily wellbeing through check-ins
- Process subscription payments through Dodo Payments
- Improve the app and fix technical issues
- Send transactional emails related to your account

We do not sell your data. We do not use your data for advertising. We do not share your data with third parties except as described in this policy.`
        },
        {
          title: "4. Children's data",
          content: `AskNeer is designed for use by parents and guardians aged 18 and over. By creating a child profile, you confirm that you are the parent or legal guardian of the child whose information you are entering, and that you consent to us storing that child's information to provide the service.

We store child profile data (name, date of birth, health notes) solely to personalize our AI responses. We do not sell your child's personal information or share 
it with third parties for advertising or their own 
independent purposes. We use carefully selected service 
providers - including our AI, hosting, and database 
providers - solely as necessary to operate AskNeer., never used for advertising, and never used for behavioral profiling.

You can request deletion of all child data at any time by emailing info@askneer.com.`
        },
        {
          title: "5. How we store your data",
          content: `Your data is stored securely in Supabase (a cloud database provider). Chat messages and memories are encrypted in transit using HTTPS. We retain your data for as long as your account is active. If you delete your account, we will delete your data within 30 days.

AskNeer uses the following third-party services to operate:
- Anthropic Claude API - to generate AI responses (see Section 9 for full details)
- Supabase - for secure data storage
- Dodo Payments - for payment processing
- Vercel - for app hosting
- Google OAuth - for sign-in`
        },
        {
          title: "6. Your rights",
          content: `You have the right to:

- Access all data we hold about you and your child
- Correct inaccurate data
- Request deletion of your data and your child's data
- Export your data
- Withdraw consent at any time

To exercise any of these rights, email us at info@askneer.com. We will respond within 30 days.`
        },
        {
          title: "7. Cookies",
          content: `AskNeer uses minimal cookies necessary for authentication (keeping you logged in) and basic app functionality. We do not use advertising cookies or tracking cookies. We do not use Google Analytics or any third-party tracking tools.`
        },
        {
          title: "8. International data transfers",
          content: `AskNeer is operated from India and serves users globally including in the United States, United Kingdom, and Philippines. Your data may be processed and stored on servers located outside your country. By using AskNeer, you consent to this transfer. We take reasonable steps to ensure your data is protected in accordance with this Privacy Policy regardless of where it is processed.`
        },
        {
          title: "9. AI and automated processing - Anthropic API",
          content: `AskNeer uses Anthropic's commercial Claude API to generate AI responses. This is important to understand clearly:

WHAT IS SENT TO ANTHROPIC:
When you ask AskNeer a question, the following is sent to Anthropic's servers solely to generate your response:
- Your message
- Your child's name and age
- Relevant memories you have shared (e.g. allergies, milestones, sleep patterns)
- Recent chat history (up to 20 messages)

WHAT IS NEVER SENT TO ANTHROPIC:
- Your email address
- Your child's date of birth
- Vaccine records
- Payment information
- Daily check-in data

ANTHROPIC'S DATA HANDLING (COMMERCIAL API):
- Your data is NEVER used to train Anthropic's AI models
- API inputs and outputs are automatically deleted after 7 days
- Data is encrypted using TLS 1.2+ in transit and AES-256 at rest
- Anthropic is SOC 2 Type II certified

AskNeer uses Anthropic's commercial API - not the consumer Claude.ai service. Under commercial API terms, your data receives significantly stronger privacy protections than consumer AI products.

For full details see Anthropic's privacy policy at anthropic.com/privacy

AskNeer's AI responses are generated automatically and are for general informational purposes only - they are not a substitute for professional medical, legal, or psychological advice.`
        },
        {
          title: "10. Changes to this policy",
          content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by displaying a notice in the app. Your continued use of AskNeer after changes constitutes acceptance of the updated policy.`
        },
        {
          title: "11. Contact us",
          content: `If you have any questions about this Privacy Policy or how we handle your data, please contact us at:

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
          <a href="/privacy" style={{ color: "#E07A5F", textDecoration: "none" }}>Privacy Policy</a>
          {" · "}
          <a href="/terms" style={{ color: "#E07A5F", textDecoration: "none" }}>Terms of Service</a>
          {" · "}
          <span style={{ color: "#E07A5F" }}>Not a medical service</span>
        </p>
      </div>
    </div>
  );
}
