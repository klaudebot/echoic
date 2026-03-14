"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserContext";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import {
  User,
  Bell,
  Languages,
  CreditCard,
  Database,
  Download,
  Trash2,
  Crown,
  Check,
  Loader2,
  ExternalLink,
  Building2,
  Users,
  AlertTriangle,
} from "lucide-react";

const UpgradeCelebration = dynamic(() => import("@/components/UpgradeCelebration"), { ssr: false });

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors ${
        checked ? "bg-brand-violet" : "bg-muted"
      }`}
      style={{ minWidth: 44, height: 24 }}
    >
      <div
        className={`absolute top-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
        style={{ width: 20, height: 20 }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, setUser, refreshPlan } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "integrations">("general");

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  // Populate from user context
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Notifications
  const [emailSummaries, setEmailSummaries] = useState(true);
  const [actionItemReminders, setActionItemReminders] = useState(true);
  const [clipShares, setClipShares] = useState(false);

  // Transcription
  const [transcriptionLang, setTranscriptionLang] = useState("en-US");
  const [customVocab, setCustomVocab] = useState("");

  // Tab navigation
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("tab") === "integrations") {
      setActiveTab("integrations");
    }
  }, [searchParams]);

  // Billing
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);
  const [billingMessage, setBillingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"yearly" | "monthly">("yearly");
  const [celebratePlan, setCelebratePlan] = useState<string | null>(null);

  // Auto-trigger checkout when arriving from signup with a plan
  const [autoUpgradeTriggered, setAutoUpgradeTriggered] = useState(false);
  useEffect(() => {
    const upgradePlan = searchParams.get("upgrade");
    const interval = searchParams.get("interval");
    if (upgradePlan && !autoUpgradeTriggered) {
      setAutoUpgradeTriggered(true);
      if (interval === "monthly" || interval === "yearly") {
        setBillingInterval(interval);
      }
      // Small delay to let the page render, then trigger checkout
      setTimeout(() => handleUpgrade(upgradePlan), 500);
    }

    const billing = searchParams.get("billing");
    const plan = searchParams.get("plan");
    if (billing === "success" && plan) {
      // Show the celebration modal immediately (feels snappy)
      const displayName = plan.charAt(0).toUpperCase() + plan.slice(1);
      setCelebratePlan(displayName);

      // Sync plan with Stripe — retries to handle webhook race condition
      (async () => {
        const supabase = getSupabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        };

        for (let attempt = 0; attempt < 5; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
          try {
            const res = await fetch("/api/billing/sync", { method: "POST", headers });
            const data = await res.json();
            if (res.ok && (data.synced || data.plan === plan)) {
              await refreshPlan();
              return;
            }
          } catch { /* retry */ }
        }
        // Final fallback — just refresh whatever the DB has
        await refreshPlan();
      })();
    } else if (billing === "cancelled") {
      setBillingMessage({ type: "error", text: "Checkout was cancelled." });
      setTimeout(() => setBillingMessage(null), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleUpgrade(tier: string) {
    setUpgradingTier(tier);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ tier, interval: billingInterval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setBillingMessage({ type: "error", text: err instanceof Error ? err.message : "Upgrade failed" });
      setTimeout(() => setBillingMessage(null), 4000);
    } finally {
      setUpgradingTier(null);
    }
  }

  async function handleManageBilling() {
    setOpeningPortal(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setBillingMessage({ type: "error", text: err instanceof Error ? err.message : "Could not open billing portal" });
      setTimeout(() => setBillingMessage(null), 4000);
    } finally {
      setOpeningPortal(false);
    }
  }

  // Organization
  const [orgName, setOrgName] = useState("");
  const [orgNameSaved, setOrgNameSaved] = useState(false);
  const [orgNameLoaded, setOrgNameLoaded] = useState(false);

  useEffect(() => {
    if (!user?.organizationId || orgNameLoaded) return;
    const supabase = getSupabaseBrowser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("organizations")
      .select("name")
      .eq("id", user.organizationId)
      .single()
      .then(({ data }: { data: { name: string } | null }) => {
        if (data) {
          setOrgName(data.name);
          setOrgNameLoaded(true);
        }
      });
  }, [user?.organizationId, orgNameLoaded]);

  async function handleSaveOrgName() {
    if (!user?.organizationId || !orgName.trim()) return;
    const supabase = getSupabaseBrowser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organizations")
      .update({ name: orgName.trim() })
      .eq("id", user.organizationId);
    setOrgNameSaved(true);
    setTimeout(() => setOrgNameSaved(false), 2000);
  }

  // Export & Delete
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleSaveProfile() {
    if (user) {
      setUser({ ...user, name, email });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/account/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reverbic-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — the user will see no file download
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "HAS_TEAM_MEMBERS") {
          setDeleteError(`You have ${data.memberCount} team member${data.memberCount > 1 ? "s" : ""}. Remove all team members from the Team page before deleting your account.`);
        } else if (data.code === "HAS_PENDING_INVITES") {
          setDeleteError(`You have ${data.inviteCount} pending invite${data.inviteCount > 1 ? "s" : ""}. Cancel all pending invites from the Team page first.`);
        } else {
          setDeleteError(data.error || "Failed to delete account");
        }
        setDeleting(false);
        return;
      }
      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {celebratePlan && (
        <UpgradeCelebration
          planName={celebratePlan}
          onClose={() => {
            setCelebratePlan(null);
            // Clean up URL params
            router.replace("/settings", { scroll: false });
          }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "general" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          General
          {activeTab === "general" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-violet rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "integrations" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Integrations
          {activeTab === "integrations" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-violet rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "general" && (
      <>
      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-brand-violet" />
          <h2 className="font-heading text-lg text-foreground">Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-brand-violet text-white rounded-lg hover:bg-brand-violet/90 transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Organization — visible to owner/admin */}
      {(user?.orgRole === "owner" || user?.orgRole === "admin") && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-brand-cyan" />
            <h2 className="font-heading text-lg text-foreground">Organization</h2>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Organization Name</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Your organization"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
              />
              <button
                onClick={handleSaveOrgName}
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-brand-violet text-white rounded-lg hover:bg-brand-violet/90 transition-colors"
              >
                {orgNameSaved ? (
                  <><Check className="w-4 h-4" /> Saved</>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>

          {/* Seat usage */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Seat Usage</div>
                <div className="text-xs text-muted-foreground">
                  {user?.orgPlan?.membersLimit === -1
                    ? "Unlimited seats"
                    : `${user?.orgPlan?.membersLimit ?? 1} seats on your plan`}
                </div>
              </div>
              <a
                href="/team"
                className="text-xs text-brand-violet hover:text-brand-violet/80 font-medium transition-colors"
              >
                Manage Team
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-brand-cyan" />
          <h2 className="font-heading text-lg text-foreground">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: "Email Summaries", desc: "Receive weekly meeting summary digests", checked: emailSummaries, onChange: setEmailSummaries },
            { label: "Action Item Reminders", desc: "Get notified when action items are due", checked: actionItemReminders, onChange: setActionItemReminders },
            { label: "Clip Shares", desc: "Notify when someone shares a clip with you", checked: clipShares, onChange: setClipShares },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <ToggleSwitch checked={item.checked} onChange={item.onChange} label={item.label} />
            </div>
          ))}
        </div>
      </div>

      {/* Transcription */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Languages className="w-4 h-4 text-brand-emerald" />
          <h2 className="font-heading text-lg text-foreground">Transcription</h2>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Default Language</label>
          <select
            value={transcriptionLang}
            onChange={(e) => setTranscriptionLang(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="ja-JP">Japanese</option>
            <option value="pt-BR">Portuguese (BR)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Custom Vocabulary</label>
          <textarea
            value={customVocab}
            onChange={(e) => setCustomVocab(e.target.value)}
            rows={3}
            placeholder="Add company names, product names, or jargon (comma-separated)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30 resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Words added here will improve transcription accuracy for domain-specific terms.
          </p>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-amber" />
            <h2 className="font-heading text-lg text-foreground">Billing</h2>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="text-xs text-brand-violet hover:text-brand-violet/80 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            {openingPortal ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Manage Billing
          </button>
        </div>

        {billingMessage && (
          <div role="alert" aria-live="polite" className={`rounded-lg p-3 text-sm font-medium ${
            billingMessage.type === "success"
              ? "bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20"
              : "bg-brand-rose/10 text-brand-rose border border-brand-rose/20"
          }`}>
            {billingMessage.text}
          </div>
        )}

        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {(user?.orgPlan?.plan ?? "free").charAt(0).toUpperCase() + (user?.orgPlan?.plan ?? "free").slice(1)} Plan
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.orgPlan?.transcriptionHoursLimit === -1
                  ? "Unlimited transcription"
                  : `${user?.orgPlan?.transcriptionHoursLimit ?? 3} hours of transcription / month`}
              </div>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            user?.orgPlan?.planStatus === "active" || !user?.orgPlan?.planStatus
              ? "bg-brand-emerald/10 text-brand-emerald"
              : "bg-brand-amber/10 text-brand-amber"
          }`}>
            {user?.orgPlan?.planStatus === "past_due" ? "Past Due"
              : user?.orgPlan?.planStatus === "canceled" ? "Canceled"
              : "Active"}
          </span>
        </div>

        {/* Billing interval toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                billingInterval === "monthly"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
                billingInterval === "yearly"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-brand-emerald text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
                Save
              </span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { name: "Starter", tier: "starter", monthlyPrice: "$17.97", yearlyPrice: "$9.97", features: "30hrs, AI summaries, 3 integrations" },
            { name: "Pro", tier: "pro", monthlyPrice: "$28.97", yearlyPrice: "$18.97", features: "Unlimited, Coach, Clips, all integrations" },
            { name: "Team", tier: "team", monthlyPrice: "$38.97", yearlyPrice: "$24.97", features: "SSO, admin, API, priority support" },
          ].map((plan) => {
            const price = billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const showStrike = billingInterval === "yearly" && plan.monthlyPrice !== plan.yearlyPrice;
            const currentPlan = user?.orgPlan?.plan ?? "free";
            const isCurrentPlan = plan.tier === currentPlan;
            const isUpgrade = currentPlan === "free" || (currentPlan === "starter" && plan.tier !== "starter") || (currentPlan === "pro" && plan.tier === "team");
            return (
            <div
              key={plan.name}
              className={`border rounded-lg p-3 text-center ${
                isCurrentPlan
                  ? "border-brand-violet bg-brand-violet/5"
                  : "border-border"
              }`}
            >
              <div className="text-sm font-semibold text-foreground">{plan.name}</div>
              <div className="mt-1">
                {showStrike && (
                  <span className="text-xs text-muted-foreground line-through mr-1">{plan.monthlyPrice}</span>
                )}
                <span className="text-lg font-bold text-foreground">{price}</span>
                <span className="text-xs text-muted-foreground font-normal">/mo</span>
              </div>
              {billingInterval === "yearly" && (
                <div className="text-[10px] text-brand-emerald font-medium">billed annually</div>
              )}
              <div className="text-[11px] text-muted-foreground mt-1">{plan.features}</div>
              <button
                onClick={() => handleUpgrade(plan.tier)}
                disabled={upgradingTier !== null || isCurrentPlan || !isUpgrade}
                className={`mt-3 w-full text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                  isCurrentPlan
                    ? "bg-brand-violet/10 text-brand-violet cursor-default"
                    : isUpgrade
                      ? "bg-brand-violet text-white hover:bg-brand-violet/90"
                      : "border border-border text-muted-foreground cursor-default"
                }`}
              >
                {upgradingTier === plan.tier ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Redirecting...</>
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : isUpgrade ? (
                  "Upgrade"
                ) : (
                  "Included"
                )}
              </button>
            </div>
            );
          })}
        </div>
      </div>

      {/* Data & Account */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-brand-slate" />
          <h2 className="font-heading text-lg text-foreground">Data & Account</h2>
        </div>

        {/* Export */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Export All Data</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Download a JSON file with all your meetings, transcripts, action items, decisions, and settings.
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
            >
              {exporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4" /> Export</>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Delete Account */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-destructive">Delete Account</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account, meetings, and all associated data. This cannot be undone.
                {user?.orgPlan?.plan !== "free" && " Your subscription will be cancelled immediately."}
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-destructive/30 rounded-lg text-destructive hover:bg-destructive/5 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            ) : (
              <div className="shrink-0" />
            )}
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Are you absolutely sure?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will permanently delete your account and all data including:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                    <li>All meetings, transcripts, and recordings</li>
                    <li>Action items, decisions, and key points</li>
                    {user?.orgPlan?.plan !== "free" && <li>Your active subscription (cancelled immediately)</li>}
                    {user?.orgRole === "owner" && <li>Your entire organization and its data</li>}
                  </ul>
                </div>
              </div>

              {deleteError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
                  <p className="text-xs text-destructive font-medium">{deleteError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Permanently Delete My Account</>
                  )}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  disabled={deleting}
                  className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {activeTab === "integrations" && <IntegrationsPanel />}
    </div>
  );
}
