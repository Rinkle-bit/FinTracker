import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  QrCode,
  Share2,
  Wallet,
  ReceiptText,
  Download,
  ChartNoAxesCombined,
  PiggyBank,
  CalendarDays,
  Hourglass,
  Repeat2,
  Target,
  FileText,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sparkles,
  Smartphone
} from "lucide-react";

export function UserPanel({
  isOpen,
  onClose,
  user,
  isDemo,
  isOnline,
  totals = { income: 0, expense: 0 },
  money = (n) => `₹${n}`,
  transactionsCount = 0,
  budgetsCount = 0,
  impulsesCount = 0,
  dark,
  setDark,
  onNavigate,
  onExportCsv,
  onLogout,
  deferredPrompt,
  onInstallApp,
  isInstalled,
  notify
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  if (!isOpen) return null;

  const rawName = user?.name || "Demo User";
  const userInitials = rawName
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const email = user?.email || "demo@fintrack.app";
  const upiId = email.includes("@") ? `${email.split("@")[0]}@fintrack` : "demouser@fintrack";
  const netCashFlow = (totals.income || 0) - (totals.expense || 0);

  const handleCopyUpi = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(upiId);
    }
    setCopied(true);
    if (notify) notify(`UPI ID copied: ${upiId}`);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareQr = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${rawName}'s FinTrack UPI QR`,
          text: `Pay ${rawName} via FinTrack UPI ID: ${upiId}`,
          url: window.location.href
        });
        return;
      } catch {
        // user cancelled share
      }
    }
    handleCopyUpi();
  };

  const handleItemClick = (screenName) => {
    if (onNavigate) onNavigate(screenName);
    onClose();
  };

  return (
    <div className="user-panel-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="user-panel-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Pull Handle */}
        <div className="user-panel-handle-bar">
          <div className="user-panel-handle" />
        </div>

        {/* Top Header */}
        <div className="user-panel-head">
          <div className="user-panel-title">
            <div className="brand-mark-micro">
              <Wallet size={15} />
            </div>
            <span>FinTrack Account</span>
          </div>
          <button
            type="button"
            className="user-panel-close"
            onClick={onClose}
            aria-label="Close user panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="user-panel-scroll">
          {/* GPay/Paytm Hero Profile Card */}
          <div className="gpay-profile-hero">
            <div className="gpay-profile-top">
              <div className="gpay-avatar-wrap">
                <div className="gpay-avatar">{userInitials}</div>
                <div className="gpay-avatar-badge" title="Verified Account">
                  <ShieldCheck size={13} />
                </div>
              </div>
              <div className="gpay-hero-details">
                <div className="gpay-name-row">
                  <h3>{rawName}</h3>
                  <span className="gpay-status-pill">
                    <span className="live-dot-green" />
                    {isDemo ? "Demo Workspace" : isOnline ? "Active" : "Offline"}
                  </span>
                </div>
                <div className="gpay-upi-row">
                  <span className="gpay-upi-text">{upiId}</span>
                  <button
                    type="button"
                    className="gpay-copy-chip"
                    onClick={handleCopyUpi}
                    title="Copy UPI ID"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="gpay-meta-text">
                  <span>{email}</span>
                </div>
              </div>
            </div>

            {/* QR Toggle Button (Signature GPay & Paytm Feature) */}
            <div className="gpay-qr-strip">
              <button
                type="button"
                className={`gpay-qr-toggle-btn ${showQr ? "active" : ""}`}
                onClick={() => setShowQr((v) => !v)}
              >
                <QrCode size={16} />
                <span>{showQr ? "Hide QR Code" : "Show My QR Code"}</span>
                <ChevronRight size={14} className={`qr-chevron ${showQr ? "rotate" : ""}`} />
              </button>
            </div>

            {/* Expandable GPay / Paytm Style QR Code */}
            {showQr && (
              <div className="gpay-qr-box">
                <div className="gpay-qr-card">
                  <div className="gpay-qr-head">
                    <div className="gpay-qr-brand">
                      <Wallet size={14} />
                      <span>fin<strong>track</strong> UPI</span>
                    </div>
                    <span className="gpay-qr-badge">BHIM • UPI</span>
                  </div>

                  {/* Stylized Crisp SVG QR Graphic */}
                  <div className="gpay-qr-svg-wrap">
                    <svg viewBox="0 0 160 160" width="160" height="160" className="gpay-qr-svg">
                      <rect width="160" height="160" fill="#ffffff" rx="10" />
                      {/* Top-Left Position Marker */}
                      <rect x="12" y="12" width="40" height="40" fill="#0f172a" rx="4" />
                      <rect x="18" y="18" width="28" height="28" fill="#ffffff" rx="2" />
                      <rect x="24" y="24" width="16" height="16" fill="#10b981" rx="2" />
                      {/* Top-Right Position Marker */}
                      <rect x="108" y="12" width="40" height="40" fill="#0f172a" rx="4" />
                      <rect x="114" y="18" width="28" height="28" fill="#ffffff" rx="2" />
                      <rect x="120" y="24" width="16" height="16" fill="#10b981" rx="2" />
                      {/* Bottom-Left Position Marker */}
                      <rect x="12" y="108" width="40" height="40" fill="#0f172a" rx="4" />
                      <rect x="18" y="114" width="28" height="28" fill="#ffffff" rx="2" />
                      <rect x="24" y="120" width="16" height="16" fill="#10b981" rx="2" />

                      {/* Stylized Pattern Blocks */}
                      <rect x="60" y="14" width="8" height="8" fill="#0f172a" />
                      <rect x="76" y="14" width="16" height="8" fill="#0f172a" />
                      <rect x="68" y="26" width="12" height="12" fill="#0f172a" />
                      <rect x="88" y="26" width="8" height="8" fill="#0f172a" />
                      <rect x="60" y="42" width="20" height="8" fill="#0f172a" />

                      <rect x="14" y="60" width="12" height="12" fill="#0f172a" />
                      <rect x="34" y="60" width="18" height="8" fill="#0f172a" />
                      <rect x="14" y="78" width="8" height="16" fill="#0f172a" />
                      <rect x="28" y="78" width="16" height="8" fill="#0f172a" />
                      <rect x="30" y="92" width="12" height="8" fill="#0f172a" />

                      <rect x="108" y="60" width="18" height="8" fill="#0f172a" />
                      <rect x="134" y="60" width="12" height="12" fill="#0f172a" />
                      <rect x="114" y="76" width="12" height="16" fill="#0f172a" />
                      <rect x="134" y="80" width="12" height="8" fill="#0f172a" />
                      <rect x="110" y="96" width="24" height="6" fill="#0f172a" />

                      <rect x="60" y="110" width="12" height="12" fill="#0f172a" />
                      <rect x="80" y="110" width="14" height="8" fill="#0f172a" />
                      <rect x="60" y="130" width="24" height="8" fill="#0f172a" />
                      <rect x="102" y="112" width="10" height="24" fill="#0f172a" />
                      <rect x="120" y="114" width="26" height="10" fill="#0f172a" />
                      <rect x="120" y="132" width="16" height="14" fill="#0f172a" />

                      {/* Center FinTrack Logo Badge */}
                      <circle cx="80" cy="80" r="18" fill="#070a12" stroke="#10b981" strokeWidth="2.5" />
                      <path
                        d="M72 73h16a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-16a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3zm12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
                        fill="#34d399"
                      />
                    </svg>
                  </div>

                  <div className="gpay-qr-foot">
                    <strong>{rawName}</strong>
                    <span>Scan with GPay, Paytm, PhonePe or any UPI app</span>
                  </div>

                  <div className="gpay-qr-actions">
                    <button type="button" className="gpay-qr-btn" onClick={handleCopyUpi}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy ID"}</span>
                    </button>
                    <button type="button" className="gpay-qr-btn primary" onClick={handleShareQr}>
                      <Share2 size={14} />
                      <span>Share QR</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Paytm Passbook / GPay Bank Balance Card */}
          <div className="gpay-bank-card">
            <div className="gpay-bank-top">
              <div className="gpay-bank-label">
                <Wallet size={16} />
                <span>FinTrack Primary Balance</span>
              </div>
              <button
                type="button"
                className="gpay-eye-btn"
                onClick={() => setBalanceHidden((v) => !v)}
                title={balanceHidden ? "Show balance" : "Hide balance"}
              >
                {balanceHidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="gpay-bank-amount-row">
              <span className="gpay-bank-amount">
                {balanceHidden ? "₹ ••••••" : money(netCashFlow)}
              </span>
              <span className={`gpay-bank-trend ${netCashFlow >= 0 ? "positive" : "negative"}`}>
                {netCashFlow >= 0 ? "+ Positive Flow" : "- Spending Exceeds"}
              </span>
            </div>

            {/* Quick Action Chips (Passbook, Statement, Insights) */}
            <div className="gpay-bank-chips">
              <button
                type="button"
                className="gpay-bank-chip"
                onClick={() => handleItemClick("Transactions")}
              >
                <ReceiptText size={14} />
                <span>Passbook ({transactionsCount})</span>
              </button>

              <button
                type="button"
                className="gpay-bank-chip"
                onClick={() => {
                  if (onExportCsv) onExportCsv();
                  if (notify) notify("Statement exported as CSV");
                }}
              >
                <Download size={14} />
                <span>Statement</span>
              </button>

              <button
                type="button"
                className="gpay-bank-chip"
                onClick={() => handleItemClick("Analytics")}
              >
                <ChartNoAxesCombined size={14} />
                <span>Insights</span>
              </button>
            </div>
          </div>

          {/* Group 1: Financial Services & Tools (Organized, No Duplicacy) */}
          <div className="gpay-section">
            <div className="gpay-section-header">Financial Services & Tools</div>
            <div className="gpay-tile-list">
              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Budgets")}
              >
                <div className="gpay-tile-icon emerald">
                  <PiggyBank size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Budgets & Spending Limits</strong>
                  <span>{budgetsCount > 0 ? `${budgetsCount} active envelopes` : "Set monthly category limits"}</span>
                </div>
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>

              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Calendar")}
              >
                <div className="gpay-tile-icon cyan">
                  <CalendarDays size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Bills & Payment Calendar</strong>
                  <span>Schedule & visual due date tracker</span>
                </div>
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>

              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Anti-Impulse")}
              >
                <div className="gpay-tile-icon amber">
                  <Hourglass size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Anti-Impulse Chamber</strong>
                  <span>
                    {impulsesCount > 0
                      ? `${impulsesCount} purchases cooling down`
                      : "Pause impulse buys with smart timer"}
                  </span>
                </div>
                {impulsesCount > 0 && <span className="gpay-tile-pill amber">{impulsesCount}</span>}
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>

              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Recurring")}
              >
                <div className="gpay-tile-icon violet">
                  <Repeat2 size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Recurring Subscriptions</strong>
                  <span>Subscriptions & auto-debit radar</span>
                </div>
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>

              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Savings Goals")}
              >
                <div className="gpay-tile-icon teal">
                  <Target size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Savings Goals & Pots</strong>
                  <span>Emergency fund & major milestones</span>
                </div>
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>

              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Reports")}
              >
                <div className="gpay-tile-icon rose">
                  <FileText size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Financial Health Reports</strong>
                  <span>Detailed cashflow & category breakdown</span>
                </div>
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>
            </div>
          </div>

          {/* Group 2: Display & Workspace Preferences */}
          <div className="gpay-section">
            <div className="gpay-section-header">Appearance & Preferences</div>
            <div className="gpay-tile-list">
              {/* Direct 1-Tap Theme Switcher */}
              <div className="gpay-tile no-hover">
                <div className="gpay-tile-icon slate">
                  {dark ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className="gpay-tile-info">
                  <strong>Theme Appearance</strong>
                  <span>{dark ? "Obsidian Dark Mode" : "Clean Light Mode"}</span>
                </div>
                <div className="gpay-theme-switch">
                  <button
                    type="button"
                    className={`gpay-theme-opt ${dark ? "active" : ""}`}
                    onClick={() => {
                      if (!dark) setDark(true);
                    }}
                  >
                    <Moon size={13} />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    className={`gpay-theme-opt ${!dark ? "active" : ""}`}
                    onClick={() => {
                      if (dark) setDark(false);
                    }}
                  >
                    <Sun size={13} />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Settings Screen Shortcut */}
              <button
                type="button"
                className="gpay-tile"
                onClick={() => handleItemClick("Settings")}
              >
                <div className="gpay-tile-icon indigo">
                  <Settings size={18} />
                </div>
                <div className="gpay-tile-info">
                  <strong>Workspace Settings</strong>
                  <span>Currency (₹ INR), security PIN & categories</span>
                </div>
                <ChevronRight size={16} className="gpay-tile-arrow" />
              </button>

              {/* PWA App Install Tile */}
              {deferredPrompt && (
                <button
                  type="button"
                  className="gpay-tile install-highlight"
                  onClick={() => {
                    if (onInstallApp) onInstallApp();
                    onClose();
                  }}
                >
                  <div className="gpay-tile-icon emerald-glow">
                    <Smartphone size={18} />
                  </div>
                  <div className="gpay-tile-info">
                    <strong>Install FinTrack App</strong>
                    <span>Add to Home Screen for 100% offline access</span>
                  </div>
                  <span className="gpay-tile-pill green">Install</span>
                </button>
              )}
            </div>
          </div>

          {/* Group 3: Privacy, Security & Sign Out */}
          <div className="gpay-section">
            <div className="gpay-section-header">Security & Account</div>
            <div className="gpay-tile-list">
              <div className="gpay-privacy-card">
                <ShieldCheck size={18} className="privacy-shield" />
                <div>
                  <strong>Client-Side Encrypted</strong>
                  <p>All financial logs, SMS parsed data, and balances remain local to your browser.</p>
                </div>
              </div>

              <button
                type="button"
                className="gpay-logout-btn"
                onClick={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={16} />
                <span>Log out of FinTrack</span>
              </button>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="user-panel-footer">
            <div className="footer-tagline">
              <Sparkles size={12} />
              <span>FinTrack App v2.4.0 • Obsidian & Emerald PWA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPanel;

