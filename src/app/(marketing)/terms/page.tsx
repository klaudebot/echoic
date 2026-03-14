import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Reverbic",
  description: "Terms and conditions for using the Reverbic platform.",
};

export default function TermsPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-heading mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: March 12, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-xl [&_h2]:font-heading [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-muted-foreground [&_li]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Reverbic (&quot;the Service&quot;), operated by Reverbic (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these terms.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Reverbic is an AI-powered meeting transcription and intelligence platform. The Service provides audio/video recording, automated transcription, AI-generated summaries, action item extraction, decision tracking, meeting coaching, and related collaboration features.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            To use the Service, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use.
          </p>

          <h2>4. Recording Consent & Legal Compliance</h2>
          <p>
            <strong>You are solely responsible for ensuring that your use of Reverbic complies with all applicable laws regarding the recording and transcription of conversations.</strong>
          </p>
          <p>In particular, you acknowledge and agree that:</p>
          <ol>
            <li><strong>Consent requirements vary by jurisdiction.</strong> Some jurisdictions require the consent of all parties to a conversation before recording (two-party or all-party consent laws). Other jurisdictions require consent of only one party (one-party consent laws). It is your responsibility to determine and comply with the laws applicable to your recordings.</li>
            <li><strong>You must notify participants.</strong> Before recording any meeting or conversation, you must inform all participants that the session will be recorded and processed by AI for transcription, summarization, and analysis.</li>
            <li><strong>You must obtain consent.</strong> Where required by law, you must obtain explicit consent from all participants before recording begins.</li>
            <li><strong>Violation may result in legal liability.</strong> Unauthorized recording may violate federal and state wiretapping laws, privacy regulations (including GDPR, CCPA, and similar frameworks), and other applicable laws. Violations can result in civil liability and criminal penalties.</li>
            <li><strong>Reverbic is not liable.</strong> We provide a tool; you are responsible for how you use it. We are not a party to your meetings and bear no responsibility for ensuring participant consent. You agree to indemnify us against any claims arising from your failure to comply with recording consent laws.</li>
          </ol>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service to record conversations without proper consent as required by applicable law</li>
            <li>Upload or process content that is illegal, harmful, defamatory, or infringes on third-party rights</li>
            <li>Attempt to reverse-engineer, decompile, or extract the source code of our AI models or proprietary technology</li>
            <li>Use the Service to harass, surveil, or monitor individuals without their knowledge and consent</li>
            <li>Share account credentials or allow unauthorized access to your account</li>
            <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
            <li>Exceed your plan&apos;s usage limits through circumvention or abuse</li>
            <li>Interfere with the operation, security, or availability of the Service</li>
          </ul>

          <h2>6. Subscription Plans & Billing</h2>

          <h3>6.1 Plans</h3>
          <p>
            Reverbic offers a free tier and paid subscription plans (Starter, Pro, Team). Plan features, limits, and pricing are described on our pricing page and may change with notice.
          </p>

          <h3>6.2 Billing</h3>
          <p>
            Paid subscriptions are billed in advance on a monthly or annual basis through Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis. All fees are in US dollars unless otherwise stated.
          </p>

          <h3>6.3 Cancellation</h3>
          <p>
            You may cancel your subscription at any time through your account settings or the Stripe Customer Portal. Upon cancellation, your subscription remains active until the end of the current billing period. After expiration, your account reverts to the free tier. We do not provide refunds for partial billing periods.
          </p>

          <h3>6.4 Failed Payments</h3>
          <p>
            If a payment fails, we will attempt to process it again. If payment cannot be collected after reasonable attempts, we may suspend or downgrade your account.
          </p>

          <h2>7. Your Content</h2>

          <h3>7.1 Ownership</h3>
          <p>
            You retain ownership of all content you upload or create through the Service, including recordings, transcriptions, and meeting data. We do not claim ownership of your content.
          </p>

          <h3>7.2 License to Us</h3>
          <p>
            By uploading content, you grant us a limited, non-exclusive license to process, store, and display your content solely for the purpose of providing and improving the Service. This license terminates when you delete your content or close your account.
          </p>

          <h3>7.3 AI Processing</h3>
          <p>
            You understand that your recordings and transcriptions will be processed by AI systems (including third-party AI providers) to generate summaries, action items, decisions, coaching insights, and other features. We do not use your content to train AI models.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            The Service, including its design, features, code, and branding, is owned by Reverbic and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on our Service without prior written consent.
          </p>

          <h2>9. Privacy</h2>
          <p>
            Your use of the Service is also governed by our <a href="/privacy" className="text-brand-violet hover:underline">Privacy Policy</a>, which describes how we collect, use, and protect your information.
          </p>

          <h2>10. Disclaimers</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not warrant that:
          </p>
          <ul>
            <li>Transcriptions will be 100% accurate</li>
            <li>AI-generated summaries, decisions, or action items will be complete or error-free</li>
            <li>The Service will be uninterrupted, secure, or free of errors</li>
            <li>Meeting coaching insights constitute professional advice</li>
          </ul>
          <p>
            You should always verify important information from transcriptions and AI-generated content against your own knowledge and records.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Reverbic shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Reverbic and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights, including recording consent and privacy laws</li>
            <li>Content you upload or share through the Service</li>
          </ul>

          <h2>13. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination will survive, including ownership, warranty disclaimers, indemnification, and limitation of liability.
          </p>

          <h2>14. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of material changes through the Service or by email. Your continued use after changes become effective constitutes acceptance of the revised Terms.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in Delaware.
          </p>

          <h2>16. Contact</h2>
          <p>
            For questions about these Terms, contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:legal@reverbic.ai" className="text-brand-violet hover:underline">legal@reverbic.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
}
