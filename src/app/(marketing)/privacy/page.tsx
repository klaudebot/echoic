import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Reverbic",
  description: "How Reverbic collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-heading mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: March 12, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-xl [&_h2]:font-heading [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-muted-foreground [&_li]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5">
          <h2>1. Introduction</h2>
          <p>
            Reverbic (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Reverbic platform at reverbic.ai (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
          </p>
          <p>
            By using Reverbic, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>2.1 Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Name and email address</li>
            <li>Organization name (if applicable)</li>
            <li>Password (stored in hashed form)</li>
            <li>Billing information (processed securely by Stripe; we do not store full payment card details)</li>
          </ul>

          <h3>2.2 Meeting & Recording Data</h3>
          <p>When you use our transcription and recording features, we process:</p>
          <ul>
            <li>Audio and/or video recordings you upload or capture through the Service</li>
            <li>Transcriptions generated from those recordings</li>
            <li>AI-generated summaries, action items, decisions, and coaching insights</li>
            <li>Speaker identification data</li>
            <li>Metadata such as meeting duration, date, and participant count</li>
          </ul>

          <h3>2.3 Usage Data</h3>
          <p>We automatically collect:</p>
          <ul>
            <li>IP address, browser type, and operating system</li>
            <li>Pages visited, features used, and time spent on the Service</li>
            <li>Referring URLs and search terms</li>
            <li>Device identifiers</li>
          </ul>

          <h3>2.4 Cookies & Tracking</h3>
          <p>
            We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. See our cookie consent banner for controls. You can manage cookie preferences at any time through your browser settings.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process transcriptions, generate AI summaries, and deliver meeting intelligence features</li>
            <li>Process payments and manage your subscription</li>
            <li>Send transactional emails (account confirmation, billing receipts, subscription changes)</li>
            <li>Provide customer support</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information to third parties. We do <strong>not</strong> use your meeting recordings or transcriptions to train AI models.
          </p>

          <h2>4. Recording Consent & Participant Notification</h2>
          <p>
            <strong>Important:</strong> You are solely responsible for complying with all applicable laws regarding the recording and transcription of conversations. Many jurisdictions require that all parties to a conversation consent to being recorded.
          </p>
          <p>Before using Reverbic to record or transcribe any meeting or conversation, you must:</p>
          <ol>
            <li>Obtain consent from all participants before recording begins, in accordance with applicable local, state, federal, and international laws</li>
            <li>Inform all participants that the meeting is being recorded and transcribed by an AI service</li>
            <li>Inform participants that AI-generated summaries, action items, and analytics will be produced from the recording</li>
            <li>Provide participants with a way to opt out of being recorded if required by law</li>
          </ol>
          <p>
            Reverbic is not responsible for your failure to obtain proper consent. You agree to indemnify and hold us harmless from any claims arising from unauthorized recording. Some jurisdictions impose criminal penalties for recording without consent — it is your responsibility to understand and comply with the laws in your jurisdiction.
          </p>

          <h2>5. Data Sharing & Third Parties</h2>
          <p>We share information only in the following circumstances:</p>
          <ul>
            <li><strong>Service providers:</strong> We use trusted third-party services to operate our platform, including Supabase (database & authentication), Amazon Web Services (file storage), Stripe (payment processing), OpenAI (AI transcription & analysis), and Resend (email delivery). These providers access data only as needed to perform their functions.</li>
            <li><strong>Within your organization:</strong> Team members in your workspace can access shared meetings, transcriptions, and related data according to your organization&apos;s settings.</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law, subpoena, court order, or to protect our rights, property, or safety.</li>
            <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          </ul>

          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL), encryption at rest for stored recordings, and access controls. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Meeting recordings and transcriptions are retained according to your plan&apos;s storage limits and your organization&apos;s data retention settings. When you delete your account, we will delete your personal data within 30 days, except where retention is required by law.
          </p>

          <h2>8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at <a href="mailto:privacy@reverbic.ai" className="text-brand-orange hover:underline">privacy@reverbic.ai</a>.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Your data may be processed in the United States or other countries where our service providers operate. By using Reverbic, you consent to the transfer of your data to countries that may have different data protection laws than your country of residence.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            Reverbic is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children. If we learn that we have collected information from a child under 16, we will delete it promptly.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes are posted constitutes acceptance of the revised policy.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:privacy@reverbic.ai" className="text-brand-orange hover:underline">privacy@reverbic.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
}
