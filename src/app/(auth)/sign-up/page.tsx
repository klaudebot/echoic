"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const selectedInterval = searchParams.get("interval") || "yearly";

  // Redirect if already signed in
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // If already signed in and came from a plan, go to checkout
        if (selectedPlan) {
          router.replace(`/settings?upgrade=${selectedPlan}&interval=${selectedInterval}`);
        } else {
          router.replace("/dashboard");
        }
      }
    });
  }, [router, selectedPlan, selectedInterval]);

  const passwordStrength = (() => {
    if (password.length === 0) return { label: "", width: "0%", color: "" };
    if (password.length < 6) return { label: "Weak", width: "25%", color: "bg-brand-rose" };
    if (password.length < 10) return { label: "Fair", width: "50%", color: "bg-brand-amber" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 10)
      return { label: "Strong", width: "100%", color: "bg-brand-emerald" };
    return { label: "Good", width: "75%", color: "bg-brand-cyan" };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const redirectPath = selectedPlan
      ? `/auth/callback?next=${encodeURIComponent(`/settings?upgrade=${selectedPlan}&interval=${selectedInterval}`)}`
      : "/auth/callback?next=/dashboard";
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes("already registered")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (authError.message.toLowerCase().includes("rate limit")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(authError.message);
      }
      return;
    }

    // If email confirmation is required, Supabase returns a user but no session
    // Welcome content is in the Supabase confirmation email template — no separate welcome email
    if (data.user && !data.session) {
      setLoading(false);
      setError(null);
      setConfirmationSent(true);
      return;
    }

    if (selectedPlan) {
      router.push(`/settings?upgrade=${selectedPlan}&interval=${selectedInterval}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    const supabase = getSupabaseBrowser();
    const oauthNext = selectedPlan
      ? `/settings?upgrade=${selectedPlan}&interval=${selectedInterval}`
      : "/dashboard";
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(oauthNext)}`,
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Back to home */}
      <Link href="/" aria-label="Back to homepage" className="fixed top-5 left-5 z-50 flex items-center gap-1 text-sm text-white/50 hover:text-white/80 lg:text-white/40 lg:hover:text-white/70 max-lg:text-muted-foreground max-lg:hover:text-foreground transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </Link>

      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0a0c10] via-[#111318] to-[#0a0c10] items-center justify-center p-12">
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-white/[0.03] blur-3xl" />

        <div className="relative max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <img src="/icon-transparent.svg" alt="" width={28} height={28} className="shrink-0" />
            <span className="font-heading text-3xl tracking-tight text-white">
              Reverbic
            </span>
          </div>

          {selectedPlan ? (
            <>
              <h2 className="text-3xl font-heading text-white mb-4">
                You&apos;re choosing {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
              </h2>
              <p className="text-white/60 text-base leading-relaxed">
                Create your account and you&apos;ll be taken to checkout to activate your plan.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-heading text-white mb-4">
                Meeting intelligence for your whole team.
              </h2>
              <p className="text-white/60 text-base leading-relaxed">
                AI transcription, smart summaries, action items, and decision tracking — built for teams.
              </p>
            </>
          )}

          {/* Features */}
          <div className="mt-12 space-y-4 text-left">
            {[
              { icon: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z", text: "99.2% accurate AI transcription" },
              { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", text: "Auto-generated summaries & action items" },
              { icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "Decision tracking across meetings" },
              { icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342", text: "Meeting Coach with personalized tips" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <svg className="w-5 h-5 text-brand-cyan shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
                <span className="text-sm text-white/80">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Sign Up Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src="/icon-transparent.svg" alt="" width={22} height={22} className="shrink-0" />
            <span className="font-heading text-2xl tracking-tight text-foreground">
              Reverbic
            </span>
          </div>

          {confirmationSent ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-emerald/10">
                <svg className="h-8 w-8 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-2xl font-heading text-foreground sm:text-3xl">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                {selectedPlan
                  ? " Click the link to activate your account — you'll be taken straight to checkout."
                  : " Click the link to activate your account and get started."}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Didn&apos;t get the email? Check your spam folder or try signing up again.
              </p>
            </div>
          ) : (<>
          <h1 className="text-2xl font-heading text-foreground sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedPlan
              ? `Sign up to start your ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan`
              : "Start transcribing meetings in under 2 minutes"}
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-brand-rose/20 bg-brand-rose/5 px-4 py-3" role="alert" aria-live="polite">
              <p className="text-sm text-brand-rose">{error}</p>
            </div>
          )}

          {/* OAuth */}
          <div className="mt-8 flex flex-col gap-3">
            <button onClick={() => handleOAuth("google")} className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("github")} className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-2" aria-live="polite" role="status">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-violet px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-violet/25 hover:bg-brand-violet/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Dialog>
              <DialogTrigger className="underline hover:text-foreground transition-colors cursor-pointer">Terms of Service</DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Terms of Service</DialogTitle>
                  <p className="text-xs text-muted-foreground">Last updated: March 12, 2026</p>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 -mx-4 px-4">
                  <TermsContent />
                </div>
              </DialogContent>
            </Dialog>
            {" "}and{" "}
            <Dialog>
              <DialogTrigger className="underline hover:text-foreground transition-colors cursor-pointer">Privacy Policy</DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Privacy Policy</DialogTitle>
                  <p className="text-xs text-muted-foreground">Last updated: March 12, 2026</p>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 -mx-4 px-4">
                  <PrivacyContent />
                </div>
              </DialogContent>
            </Dialog>
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-brand-violet hover:text-brand-violet/80 transition-colors">
              Sign in
            </Link>
          </p>
          </>)}
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3 [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5">
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Reverbic (&quot;the Service&quot;), operated by Reverbic (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these terms.</p>

      <h2>2. Description of Service</h2>
      <p>Reverbic is an AI-powered meeting transcription and intelligence platform. The Service provides audio/video recording, automated transcription, AI-generated summaries, action item extraction, decision tracking, meeting coaching, and related collaboration features.</p>

      <h2>3. Account Registration</h2>
      <p>To use the Service, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>

      <h2>4. Recording Consent & Legal Compliance</h2>
      <p><strong>You are solely responsible for ensuring that your use of Reverbic complies with all applicable laws regarding the recording and transcription of conversations.</strong></p>
      <ol>
        <li><strong>Consent requirements vary by jurisdiction.</strong> Some jurisdictions require the consent of all parties before recording.</li>
        <li><strong>You must notify participants</strong> that the session will be recorded and processed by AI.</li>
        <li><strong>You must obtain consent</strong> where required by law before recording begins.</li>
        <li><strong>Reverbic is not liable.</strong> We provide a tool; you are responsible for how you use it.</li>
      </ol>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Record conversations without proper consent</li>
        <li>Upload illegal or harmful content</li>
        <li>Reverse-engineer our AI models or proprietary technology</li>
        <li>Harass, surveil, or monitor individuals without consent</li>
        <li>Exceed your plan&apos;s usage limits through circumvention</li>
      </ul>

      <h2>6. Subscription Plans & Billing</h2>
      <p>Paid subscriptions are billed in advance through Stripe. You may cancel at any time. Upon cancellation, your subscription remains active until the end of the current billing period.</p>

      <h2>7. Your Content</h2>
      <p>You retain ownership of all content you upload. We do not use your content to train AI models.</p>

      <h2>8. Disclaimers</h2>
      <p>The Service is provided &quot;as is&quot; without warranties. We do not warrant that transcriptions will be 100% accurate.</p>

      <h2>9. Limitation of Liability</h2>
      <p>Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.</p>

      <h2>10. Contact</h2>
      <p>Contact us at <a href="mailto:legal@reverbic.ai" className="text-brand-violet hover:underline">legal@reverbic.ai</a>.</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3 [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5">
      <h2>1. Introduction</h2>
      <p>Reverbic operates the platform at reverbic.ai. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.</p>

      <h2>2. Information We Collect</h2>
      <h3>Account Information</h3>
      <p>Name, email, organization name, password (hashed), and billing information (processed by Stripe).</p>
      <h3>Meeting & Recording Data</h3>
      <p>Audio/video recordings, transcriptions, AI-generated summaries, action items, decisions, coaching insights, and meeting metadata.</p>
      <h3>Usage Data</h3>
      <p>IP address, browser type, pages visited, features used, and device identifiers.</p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Process transcriptions and deliver AI features</li>
        <li>Process payments and manage subscriptions</li>
        <li>Send transactional emails</li>
        <li>Detect and prevent fraud</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information. We do <strong>not</strong> use your recordings to train AI models.</p>

      <h2>4. Recording Consent</h2>
      <p><strong>You are solely responsible for complying with all applicable laws regarding recording conversations.</strong></p>

      <h2>5. Data Sharing</h2>
      <p>We share information only with service providers (Supabase, AWS, Stripe, OpenAI, Resend), within your organization&apos;s workspace, when required by law, or in business transfers.</p>

      <h2>6. Data Security & Retention</h2>
      <p>We implement encryption in transit and at rest. We retain data while your account is active. Upon deletion, personal data is removed within 30 days.</p>

      <h2>7. Your Rights</h2>
      <p>You may have the right to access, correct, delete, or port your data. Contact <a href="mailto:privacy@reverbic.ai" className="text-brand-violet hover:underline">privacy@reverbic.ai</a>.</p>

      <h2>8. Contact Us</h2>
      <p>For questions, contact <a href="mailto:privacy@reverbic.ai" className="text-brand-violet hover:underline">privacy@reverbic.ai</a>.</p>
    </div>
  );
}
