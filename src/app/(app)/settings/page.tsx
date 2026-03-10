"use client";

import { useState } from "react";
import { AppLink } from "@/components/DemoContext";
import {
  User,
  Bell,
  Languages,
  CreditCard,
  Key,
  Database,
  Eye,
  EyeOff,
  Copy,
  Download,
  Trash2,
  Crown,
} from "lucide-react";

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors ${
        checked ? "bg-brand-violet" : "bg-muted"
      }`}
      style={{ minWidth: 40, height: 22 }}
    >
      <div
        className={`absolute top-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}

export default function SettingsPage() {
  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("en");

  // Notifications
  const [emailSummaries, setEmailSummaries] = useState(true);
  const [actionItemReminders, setActionItemReminders] = useState(true);
  const [clipShares, setClipShares] = useState(false);

  // Transcription
  const [transcriptionLang, setTranscriptionLang] = useState("en-US");
  const [customVocab, setCustomVocab] = useState("");

  // API
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const apiKey = "echo_sk_live_" + "*".repeat(24);

  function handleCopyApiKey() {
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

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

        <button className="text-sm font-medium px-4 py-2 bg-brand-violet text-white rounded-lg hover:bg-brand-violet/90 transition-colors">
          Save Changes
        </button>
      </div>

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
              <ToggleSwitch checked={item.checked} onChange={item.onChange} />
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
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-brand-amber" />
          <h2 className="font-heading text-lg text-foreground">Billing</h2>
        </div>

        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Free Plan</div>
              <div className="text-xs text-muted-foreground">5 meetings/month included</div>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">Current</span>
        </div>

        <button className="text-sm font-medium px-4 py-2 border border-brand-violet text-brand-violet rounded-lg hover:bg-brand-violet/5 transition-colors">
          Upgrade to Pro
        </button>
      </div>

      {/* API */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-brand-rose" />
          <h2 className="font-heading text-lg text-foreground">API</h2>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">API Key</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground overflow-hidden">
              {showApiKey ? apiKey : "echo_sk_live_" + "*".repeat(24)}
            </div>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopyApiKey}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {apiKeyCopied && <p className="text-xs text-brand-emerald mt-1">Copied to clipboard!</p>}
        </div>
      </div>

      {/* Data */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-brand-slate" />
          <h2 className="font-heading text-lg text-foreground">Data</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" />
            Export All Data
          </button>
          <button className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-destructive/30 rounded-lg text-destructive hover:bg-destructive/5 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Exporting will generate a ZIP file with all your meetings, transcripts, clips, and settings.
          Account deletion is permanent and cannot be undone.
        </p>
      </div>
    </div>
  );
}
