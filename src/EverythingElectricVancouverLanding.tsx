// EverythingElectricVancouverLanding.tsx
// -----------------------------------------------------------------------------
// PRODUCTION COMPONENT — Event Hub + 2026 PHEV Teaser (hash routing SPA)
// Fixes in this revision:
// - Addressed "Unterminated JSX contents" by fully closing the <ul> and all
//   nested elements in the preorder footer Links section.
// - Rechecked all JSX trees for balanced tags and terminated string literals.
// - Keeps prior fixes (component scope, anchor closures, hash routing).
// -----------------------------------------------------------------------------
// HOW TO INTEGRATE
// - Swap hero media: search "HERO MEDIA PLACEHOLDER" and change the <source> src
//   or replace the <video> with an <img>.
// - Wire submitLead(): replace the stub with your API/CRM call (keep payload).
// - Change brand color: edit ACCENT.
// - Analytics: implement sendAnalytics() (GA4/Meta/Klaviyo). Calls are in CTAs.
// - Routing: # (home) and #/preorder (teaser). Component listens to hashchange.
// - Accessibility: focus-visible rings, aria-live, ESC to close modals.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

// --- CONFIG ------------------------------------------------------------------
const ACCENT = '#E60012';
const SOURCE_TAG = 'FullyCharged2025';
const PREORDER_SOURCE_TAG = 'Preorder2026Teaser';

const CONTACT = {
  phone: '(604) 249 3888',
  phoneHref: 'tel:+16042493888',
  address: '1885 Clark Drive, Vancouver, BC, V5N 3G5',
  mapsHref: 'https://maps.app.goo.gl/Q1tg1G8KxMTBbfJG9',
  hours: [
    'Mon–Thu 9am–7pm',
    'Fri–Sat 10am–6pm',
    'Sun 11am–5pm',
  ],

};

// --- UTILITIES ---------------------------------------------------------------
function getQueryParams() {
  if (typeof window === 'undefined') return {} as Record<string, string>;
  const sp = new URLSearchParams(window.location.search);
  return {
    utm_source: sp.get('utm_source') || '',
    utm_medium: sp.get('utm_medium') || '',
    utm_campaign: sp.get('utm_campaign') || '',
    qr_id: sp.get('qr') || '',
  };
}

function getRouteFromHash() {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash || '';
  return h.startsWith('#/preorder') ? 'preorder' : 'home';
}

function isValidEmail(v: string) { return /.+@.+\..+/.test(v); }

function formatPhone(input: string) {
  // Improved phone mask: allow backspace and natural editing
  const raw = input.replace(/[^\d]/g, '');
  if (raw.length === 0) return '';
  if (raw.length <= 3) return raw;
  if (raw.length <= 6) return `(${raw.slice(0,3)}) ${raw.slice(3)}`;
  return `(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6,10)}`;
}

// --- ANALYTICS STUB ----------------------------------------------------------
function sendAnalytics(eventName: string, payload: Record<string, any> = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[analytics]', eventName, payload);
  }
}

// --- LEAD SUBMISSION STUB ----------------------------------------------------
type LeadFormType = 'gift' | 'test' | 'brochure' | 'preorder2026';
interface LeadPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
  joinEbike?: string;
  name?: string;
  notes?: string;
  [key: string]: any;
}

export async function submitLead(formType: LeadFormType, payload: LeadPayload) {
  const WORKER_URL = 'https://vm-lead-proxy.alex-cd6.workers.dev';

  function splitName(full?: string, first?: string, last?: string) {
    const n = (full || `${first || ''} ${last || ''}`).trim().replace(/\s+/g, ' ');
    if (!n) return { firstName: '', lastName: '' };
    const parts = n.split(' ');
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') || '' };
  }

  if (formType === 'gift' || formType === 'brochure') {
    const { firstName, lastName } =
      splitName(payload.name, payload.firstName, payload.lastName);

    const body = {
      firstName,
      lastName,
      eMail: payload.eMail || '',
      phoneNumber: payload.phoneNumber || '',
      source: payload.source || 'FullyCharged2025',
      joinEbike: !!payload.joinEbike,
      utm_source: payload.utm_source || '',
      utm_medium: payload.utm_medium || '',
      utm_campaign: payload.utm_campaign || '',
      qr_id: payload.qr_id || '',
      formType,
    };

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Worker failed: ${res.status}`);
    return { ok: true };
  } else if (formType === 'test') {
    // --- JOTFORM LOGIC (unchanged) ---
    const jotformApiKey = 'e8457bea10b7692f64b06e82e5b59a16';
    let jotformFormId = '252456299052260';
    const fullNameId = '3';
    const emailId = '4';
    const phoneId = '5';
    const ebikeFieldId = '7';
    const params = new URLSearchParams();
    params.append(`submission[${fullNameId}][first]`, payload.firstName || '');
    params.append(`submission[${fullNameId}][last]`, payload.lastName || '');
    params.append(`submission[${emailId}]`, payload.email || '');
    params.append(`submission[${phoneId}]`, payload.phone || '');
    if (payload.joinEbike) {
      params.append(`submission[${ebikeFieldId}]`, 'Yes');
    }
    try {
      const res = await fetch(
        `https://api.jotform.com/form/${jotformFormId}/submissions?apiKey=${jotformApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        }
      );
      const result = await res.json();
      if (res.ok && result?.responseCode === 200) {
        return { ok: true, id: result?.submissionID || '' };
      } else {
        return { ok: false };
      }
    } catch {
      return { ok: false };
    }
  } else {
    await new Promise((r) => setTimeout(r, 750));
    return { ok: true, id: Math.random().toString(36).slice(2) };
  }
}

// --- MODAL FORM (Gift/Test/Brochure) ----------------------------------------
function ModalForm({ isOpen, onClose, formType, hidden }: {
  isOpen: boolean;
  onClose: () => void;
  formType: 'gift' | 'test' | 'brochure';
  hidden: Record<string, string>;
}) {
  const titleMap: Record<string, string> = {
    gift: 'Redeem your $1000 EV Gift Card',
    test: 'Win a New E-Bike',
    brochure: '2026 Outlander PHEV Priority List',
  };
  const firstRef = useRef<HTMLInputElement>(null);
    // For gift and test CTA (ebike)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    // For brochure CTA
    const [name, setName] = useState('');
  // Shared fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [joinEbike, setJoinEbike] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setTimeout(() => firstRef.current?.focus(), 40);
    } else {
      setFirstName(''); setLastName(''); setName(''); setEmail(''); setPhone(''); setNotes(''); setConsent(false); setJoinEbike(false); setDate(''); setTime('');
    }
  }, [isOpen]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formType === 'gift' || formType === 'test' || formType === 'brochure') {
  if (!firstName.trim() || !lastName.trim() || !isValidEmail(email) || !phone.trim() || !consent) { setStatus('error'); return; }
      setStatus('submitting');
      // Ensure payload includes all fields for Airtable webhook
      const payload = {
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        eMail: email.trim(),
        phoneNumber: phone.trim(),
        source: SOURCE_TAG,
        joinEbike: joinEbike ? 'yes' : '',
        ...hidden
      };
      try {
        sendAnalytics('lead_submit', { formType, ...payload });
        const res = await submitLead(formType, payload);
        setStatus(res?.ok ? 'success' : 'error');
      } catch { setStatus('error'); }
    }
  }

  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog" aria-modal="true" aria-labelledby={`modal-title-${formType}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onMouseDown={onOverlayMouseDown}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl bg-neutral-900 text-white shadow-2xl ring-1 ring-white/10"
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 gap-2 relative">
              <h2 id={`modal-title-${formType}`} className="text-xl font-semibold tracking-tight">{titleMap[formType]}</h2>
              <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full p-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: ACCENT }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-2 pb-4 sm:px-6 sm:pb-6" noValidate>
              <div className="space-y-3">
                {/* Name fields for gift and test CTA */}
                {(formType === 'gift' || formType === 'test' || formType === 'brochure') ? (
                  <div>
                    <label className="block text-sm text-neutral-200">Name</label>
                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        ref={firstRef}
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-400 ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
                        style={{ outlineColor: ACCENT }}
                        placeholder="First Name"
                        autoComplete="given-name"
                      />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-400 ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
                        style={{ outlineColor: ACCENT }}
                        placeholder="Last Name"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`name-${formType}`} className="block text-sm text-neutral-200">Name</label>
                    <input
                      id={`name-${formType}`}
                      ref={firstRef}
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-400 ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
                      style={{ outlineColor: ACCENT }}
                      placeholder="Your full name"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor={`email-${formType}`} className="block text-sm text-neutral-200">Email</label>
                  <input id={`email-${formType}`} type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
                         className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-400 ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900" style={{ outlineColor: ACCENT }} placeholder="example@example.com" />
                </div>
                <div>
                  <label htmlFor={`phone-${formType}`} className="block text-sm text-neutral-200">Phone Number</label>
                  <input id={`phone-${formType}`} type="tel" inputMode="tel" required value={phone} onChange={(e)=>setPhone(formatPhone(e.target.value))}
                         className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-400 ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900" style={{ outlineColor: ACCENT }} placeholder="(000) 000-0000" />
                  <span className="text-xs text-neutral-400">Please enter a valid phone number.</span>
                </div>
                {/* Hidden fields for analytics/source, not rendered visually */}
                <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2" style={{ display: 'none' }}>
                  {Object.entries({ source: SOURCE_TAG, ...hidden }).map(([k,v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                </fieldset>
                <label className="mt-1 flex items-start gap-3 text-sm">
                  <input type="checkbox" required checked={consent} onChange={(e)=>setConsent(e.target.checked)}
                         className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-800 text-white focus:ring-2" style={{ accentColor: ACCENT }} />
                  <span>I agree to be contacted by Vancouver Mitsubishi.*</span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={joinEbike} onChange={e=>setJoinEbike(e.target.checked)}
                         className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-800 text-white focus:ring-2" style={{ accentColor: ACCENT }} />
                  <span>Join the E-Bike Giveaway</span>
                </label>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                {formType === 'gift' ? (
                  <p className="max-w-xs text-xs italic text-neutral-400">*The $1000 EV Gift Card is valid towards the purchase of a new Mitsubishi Outlander PHEV, or $500 towards a used PHEV/EV from our inventory. One per household. Must be a visitor of Everything Electric Vancouver 2025. While supplies last. Conditions apply. OAC. Vancouver Mitsubishi reserves the right to modify or withdraw offers.*</p>
                ) : formType === 'test' ? (
                  <p className="max-w-xs text-xs italic text-neutral-400">*No purchase necessary. One entry per household. Winner will be selected at random and notified by Vancouver Mitsubishi. Prize must be accepted as awarded; no cash value or substitutions. Odds of winning depend on number of eligible entries received. Giveaway open to visitors of Everything Electric Vancouver 2025 only. Vancouver Mitsubishi reserves the right to modify, cancel, or withdraw this offer at any time. Additional terms and conditions may apply.*</p>
                ) : (
                  <p className="max-w-xs text-xs italic text-neutral-400">*By joining the 2026 Outlander PHEV Priority List, you acknowledge this is an expression of interest only. Pre‑production information; features, timing, and availability subject to change without notice. Not an offer to sell. Vancouver Mitsubishi reserves the right to modify, cancel, or withdraw this program at any time.*</p>
                )}
                <button type="submit" disabled={status==='submitting'} className="ml-0 sm:ml-4 inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto" style={{ backgroundColor: ACCENT, outlineColor: ACCENT }}>
                  {status==='submitting' ? 'Submitting…' : 'Submit'}
                </button>
              </div>
              <div className="mt-4 min-h-[1.25rem]" aria-live="polite">
                {status==='error' && <p className="text-sm text-rose-400">Please complete required fields with a valid email and consent.</p>}
                {status==='success' && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    Thank you! We’ll reach out shortly.
                  </div>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  // ...existing code...
  );
}

// --- INLINE PREORDER FORM ----------------------------------------------------
function PreorderForm({ hidden }: { hidden: Record<string, string> }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  if (!name.trim() || !isValidEmail(email) || !phone.trim() || !consent) { setStatus('error'); return; }
    setStatus('submitting');
    const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim(), source: PREORDER_SOURCE_TAG, ...hidden };
    try {
      sendAnalytics('lead_submit', { formType: 'preorder2026', ...payload });
      const res = await submitLead('preorder2026', payload);
      setStatus(res?.ok ? 'success' : 'error');
    } catch { setStatus('error'); }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto mt-8 w-full max-w-xl rounded-2xl bg-neutral-900 p-6 ring-1 ring-white/10">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="pre-name" className="block text-sm text-neutral-200">Name<span aria-hidden="true"> *</span></label>
          <input id="pre-name" type="text" value={name} onChange={(e)=>setName(e.target.value)} required className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900" style={{ outlineColor: ACCENT }} placeholder="Your full name" />
        </div>
        <div>
          <label htmlFor="pre-email" className="block text-sm text-neutral-200">Email<span aria-hidden="true"> *</span></label>
          <input id="pre-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900" style={{ outlineColor: ACCENT }} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="pre-phone" className="block text-sm text-neutral-200">Phone<span aria-hidden="true"> *</span></label>
          <input id="pre-phone" type="tel" inputMode="tel" required value={phone} onChange={(e)=>setPhone(formatPhone(e.target.value))} className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900" style={{ outlineColor: ACCENT }} placeholder="(604) 555-0199" />
        </div>
        <div>
          <label htmlFor="pre-notes" className="block text-sm text-neutral-200">Notes <span className="text-neutral-400">(optional)</span></label>
          <textarea id="pre-notes" rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} className="mt-1 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900" style={{ outlineColor: ACCENT }} placeholder="Tell us what matters most to you (range, charging, seating, tech)…" />
        </div>
        <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries({ source: PREORDER_SOURCE_TAG, ...hidden }).map(([k,v]) => (
            <div key={k} className="text-xs text-neutral-400"><span className="uppercase tracking-wide">{k}: </span><span>{String(v||'')}</span></div>
          ))}
        </fieldset>
        <label className="mt-1 flex items-start gap-3 text-sm">
          <input type="checkbox" required checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-800 text-white focus:ring-2" style={{ accentColor: ACCENT }} />
          <span>I agree to be contacted by Vancouver Mitsubishi.</span>
        </label>
        <div className="flex items-center justify-between">
          <p className="max-w-xs text-xs italic text-neutral-400">Pre‑production information only. Features and availability subject to change.</p>
          <button type="submit" disabled={status==='submitting'} className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ backgroundColor: ACCENT, outlineColor: ACCENT }}>
            {status==='submitting' ? 'Submitting…' : 'Join Priority List'}
          </button>
        </div>
        <div className="min-h-[1.25rem]" aria-live="polite">
          {status==='error' && <p className="text-sm text-rose-400">Please provide a valid email and consent.</p>}
          {status==='success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Thanks! You’re on the list.
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

// --- MAIN COMPONENT ----------------------------------------------------------
export default function EverythingElectricVancouverLanding() {
  const hidden = useMemo(() => getQueryParams(), []);
  // const [mobileOpen, setMobileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'gift' | 'test' | 'brochure'>(null);
  const [route, setRoute] = useState<'home'|'preorder'>(getRouteFromHash());

  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash() as 'home'|'preorder');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.75]);
  const heroTranslate = useTransform(scrollYProgress, [0, 1], [0, -24]);

  const NavA = ({ href, onClick, children }: { href: string; onClick?: (e: any)=>void; children: React.ReactNode; }) => (
    <a href={href} onClick={onClick} className="rounded-lg px-3 py-2 text-sm text-neutral-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: ACCENT }}>{children}</a>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-[100] rounded-lg bg-neutral-800 px-4 py-2">Skip to main content</a>

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}your-logo.png`} alt="Vancouver Mitsubishi logo" className="h-8 w-8 rounded" />
              <span className="hidden text-sm font-medium text-neutral-300 sm:block">Vancouver Mitsubishi</span>
            </div>
            <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
              {route === 'home' && (
                <>
                  <NavA href="#specials">Specials</NavA>
                  <NavA href="#event">Event Info</NavA>
                  <NavA href="#contact">Contact</NavA>
                </>
              )}
            </nav>
            {/* Mobile menu button and accordion menu are hidden/removed */}
          </div>
        </div>
      </header>

      <main id="main">
        {route === 'home' ? (
          <>
            {/* HERO */}
            <section
              ref={heroRef}
              className="relative isolate w-screen overflow-hidden aspect-[16/11] sm:aspect-[16/9] aspect-[16/12]"
            >
              {/* HERO MEDIA PLACEHOLDER */}
              <div
                aria-hidden="true"
                className="absolute inset-0 w-screen aspect-[16/9] sm:aspect-[16/9] aspect-[16/12] overflow-hidden"
              >
                <motion.div style={{ opacity: heroOpacity, y: heroTranslate }} className="absolute inset-0 w-full h-full">
                  <video
                    className="absolute inset-0 w-full h-full object-cover object-center scale-125 sm:scale-100"
                    preload="auto"
                    autoPlay
                    muted
                    playsInline
                    aria-label="Background video of a Mitsubishi Outlander PHEV"
                  >
                    <source src={`${import.meta.env.BASE_URL}path-to-video.mp4`} type="video/mp4" />
                  </video>
                </motion.div>
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 4px), linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 4px)`,
                  backgroundSize: '3px 3px',
                  zIndex: 0
                }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-neutral-950" />
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full text-center">
                <motion.h1
                  className="z-10 mt-12 sm:mt-10 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl max-w-xl mx-auto px-4 sm:px-0"
                  style={{ wordBreak: 'break-word', lineHeight: '1.2' }}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  Vancouver Mitsubishi x FCL 2025
                </motion.h1>
                <motion.p className="mt-3 max-w-2xl text-base text-neutral-300 sm:text-lg hidden sm:block mx-auto px-4 sm:px-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}>
                  We loved meeting you at Everything Electric Vancouver 2025.
                </motion.p>

                {/* Mobile: Only show Redeem button, positioned near bottom */}
                <div className="flex flex-1 flex-col items-center w-full sm:hidden"></div>

                {/* Desktop/tablet: Show all buttons including Redeem, in the main hero area */}
                <motion.div className="mt-12 w-full max-w-3xl flex-col items-stretch gap-3 hidden sm:flex sm:flex-row sm:items-center sm:justify-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}>
                  <button
                    onClick={()=>{ setActiveModal('gift'); sendAnalytics('cta_click', { location: 'hero', formType: 'gift' }); }}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto"
                    style={{ backgroundColor: ACCENT, outlineColor: ACCENT }}
                  >Redeem your $1000 EV Gift Card</button>
                  <button
                    onClick={()=>{ setActiveModal('brochure'); sendAnalytics('cta_click', { location: 'hero', formType: 'brochure' }); }}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-white border-2 border-white bg-[rgba(20,20,20,0.3)] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto hover:bg-[var(--accent)] hover:border-[var(--accent)] active:bg-[var(--accent)] active:border-[var(--accent)]"
                    style={{ outlineColor: ACCENT, '--accent': ACCENT } as React.CSSProperties}
                  >Get 2025 and 2026 Outlander PHEV brochures</button>
                </motion.div>
                <p className="mt-3 sm:mt-4 text-xs text-neutral-400 hidden sm:block">Limited quantities. Conditions apply.</p>

                {/* Redeem button anchored at the bottom for both mobile and desktop/tablet */}
                <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center pb-9 sm:hidden">
                  <button
                    onClick={()=>{ setActiveModal('gift'); sendAnalytics('cta_click', { location: 'hero', formType: 'gift' }); }}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-white border-2 border-white bg-[rgba(20,20,20,0.3)] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full max-w-xs hover:bg-[var(--accent)] hover:border-[var(--accent)] active:bg-[var(--accent)] active:border-[var(--accent)]"
                    style={{ outlineColor: ACCENT, '--accent': ACCENT } as React.CSSProperties}
                  >Redeem your $1000 EV Gift Card</button>
                </div>
              </div>
            </section>

            {/* SPECIALS GRID */}
            <section id="specials" className="scroll-mt-24 border-t border-white/10 bg-neutral-950">
              <div className="mx-auto max-w-7xl px-2 py-12 sm:px-4 lg:px-8">
                <h2 className="text-xl font-semibold tracking-tight">Show Specials</h2>
                <p className="mt-1 text-sm text-neutral-400">Exclusive for Everything Electric Vancouver 2025 visitors.</p>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  <motion.article whileHover={{ y: -4 }} className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10">
                    <h3 className="text-lg font-semibold">Redeem your $1000 EV Gift Card</h3>
                    <p className="mt-2 text-sm text-neutral-300">($1000 Towards a New Outlander PHEV or $500 Towards a Used PHEV / EV of our inventory)</p>
                    <button onClick={()=>{ setActiveModal('gift'); sendAnalytics('cta_click', { location: 'grid', formType: 'gift' }); }} className="mt-4 inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto" style={{ backgroundColor: ACCENT, outlineColor: ACCENT }}>Redeem Now</button>
                  </motion.article>
                  <motion.article whileHover={{ y: -4 }} className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-white/10">
                    <h3 className="text-lg font-semibold">2026 Outlander PHEV Priority List</h3>
                    <p className="mt-2 text-sm text-neutral-300">  Get a preview and a brochure of the upcoming redesigned 2026 Outlander PHEV, and join the preorder / priority list to be the first to see it and have a chance to get it.</p>
                    <button onClick={()=>{ setActiveModal('brochure'); sendAnalytics('cta_click', { location: 'grid', formType: 'brochure' }); }} className="mt-4 inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto" style={{ backgroundColor: ACCENT, outlineColor: ACCENT }}>Send Me the Brochures</button>
                  </motion.article>
                </div>
                <p className="mt-6 text-xs italic text-neutral-400">
                  *Offers valid for visitors of Everything Electric Vancouver 2025 only. Gift card and gas card while supplies last. One per household. Conditions apply. OAC. Vancouver Mitsubishi reserves the right to modify or withdraw offers.*
                </p>
              </div>
            </section>

            {/* EVENT INFO BAND */}
            <section id="event" className="scroll-mt-24 border-t border-white/10 bg-neutral-900/60">
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" /></svg>
                    <span className="font-semibold text-white">Largest EV test-drive experience in Canada.</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 aspect-square items-center justify-center rounded-full bg-white/10">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="11" r="2" fill="currentColor" /></svg>
                      </span>
                      <p className="text-sm sm:text-base"><span className="font-medium">Everything Electric Vancouver 2025</span> — Vancouver Convention Centre, Hall 1, Stand E160.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 aspect-square items-center justify-center rounded-full bg-white/10">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="11" r="2" fill="currentColor" /></svg>
                      </span>
                      <p className="text-sm sm:text-base"><span className="font-medium">Vancouver Mitsubishi</span> — 1885 Clark Drive, Vancouver, BC, V5N 3G5</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TRUST & BENEFITS */}
            <section className="border-t border-white/10 bg-neutral-950">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-300">
                  <li>Factory-trained EV team</li><li className="text-neutral-500">•</li>
                  <li>Financing options OAC</li><li className="text-neutral-500">•</li>
                  <li>Trade-in appraisals in minutes</li><li className="text-neutral-500">•</li>
                  <li>Luxury Showroom</li><li className="text-neutral-500">•</li>
                </ul>

              </div>
            </section>

            {/* FOOTER */}
            <footer id="contact" className="scroll-mt-24 border-t border-white/10 bg-neutral-950">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold">Contact</h3>
                    <ul className="mt-3 space-y-1 text-sm text-neutral-300">
                      <li>Phone: <a className="underline-offset-2 hover:underline" href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
                      <li>Address: <a className="underline-offset-2 hover:underline" href={CONTACT.mapsHref} target="_blank" rel="noreferrer">{CONTACT.address}</a></li>
                      <li>Hours:</li>
                      {CONTACT.hours.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm text-neutral-400">© {new Date().getFullYear()} Vancouver Mitsubishi. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </footer>

            {/* HOME MODALS */}
            <ModalForm isOpen={activeModal === 'gift'} onClose={()=>setActiveModal(null)} formType="gift" hidden={hidden} />
            <ModalForm isOpen={activeModal === 'brochure'} onClose={()=>setActiveModal(null)} formType="brochure" hidden={hidden} />
          </>
        ) : (
          <>
            {/* PREORDER: HERO */}
            <section className="relative isolate border-b border-white/10">
              <div className="absolute inset-0">
                <img src="/placeholder-2026-outlander.jpg" alt="Silhouette teaser of next-generation Mitsubishi Outlander PHEV" className="h-full w-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-neutral-950" />
              </div>
              <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Next‑Generation Outlander PHEV (2026)</h1>
                <p className="mt-3 max-w-2xl text-neutral-300">Be first to know about the next chapter of Mitsubishi plug‑in hybrid performance. Join the priority list for updates, early access, and pre‑order invitations.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href="#signup" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ backgroundColor: ACCENT, outlineColor: ACCENT }} onClick={()=>sendAnalytics('cta_click', { location: 'preorder_hero', action: 'scroll_to_signup' })}>Join Priority List</a>
                  <a href="#features" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text:white ring-1 ring-white/15 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: ACCENT }}>Explore Teaser Features</a>
                </div>
                <p className="mt-4 text-xs text-neutral-400">CONFIDENTIAL: Pre‑production information. Subject to change. Not an offer to sell.</p>
              </div>
            </section>

            {/* PREORDER: FEATURES */}
            <section id="features" className="border-b border-white/10 bg-neutral-950">
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-xl font-semibold tracking-tight">Teaser Highlights</h2>
                <p className="mt-1 text-sm text-neutral-400">Details are evolving. Final specifications, availability, and pricing to be announced.</p>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { t: 'Refined electric range', d: 'Engineered for longer electric‑only commutes (anticipated).' },
                    { t: 'Faster charging', d: 'Targeted improvements for more convenient DC fast‑charging.' },
                    { t: 'Advanced driver assist', d: 'Next‑gen safety and convenience technologies under evaluation.' },
                    { t: 'Redesigned interior', d: 'Modern materials, quiet cabin, and intuitive infotainment.' },
                  ].map((f, i) => (
                    <motion.div key={i} whileHover={{ y: -4 }} className="rounded-2xl bg-neutral-900 p-6 ring-1 ring-white/10">
                      <h3 className="text-base font-semibold">{f.t}</h3>
                      <p className="mt-2 text-sm text-neutral-300">{f.d}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* PREORDER: SIGNUP */}
            <section id="signup" className="bg-neutral-950">
              <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-xl font-semibold tracking-tight">Join the Priority List</h2>
                <p className="mt-1 text-sm text-neutral-400">We’ll share updates, timing, and early access opportunities as they become available.</p>
                <PreorderForm hidden={hidden} />
                <p className="mx-auto mt-6 max-w-xl text-center text-xs italic text-neutral-400">By joining, you acknowledge this is an expression of interest only. Timing, features, and availability are subject to change without notice.</p>
              </div>
            </section>

            {/* PREORDER: FOOTER (shared styling) */}
            <footer className="border-t border-white/10 bg-neutral-950">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold">Contact</h3>
                    <ul className="mt-3 space-y-1 text-sm text-neutral-300">
                      <li>Phone: <a className="underline-offset-2 hover:underline" href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
                      <li>Address: <a className="underline-offset-2 hover:underline" href={CONTACT.mapsHref} target="_blank" rel="noreferrer">{CONTACT.address}</a></li>
                      <li>Hours:</li>
                      {CONTACT.hours.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Links</h3>
                    <ul className="mt-3 space-y-1 text-sm text-neutral-300">
                      <li><a className="underline-offset-2 hover:underline" href="#">Privacy</a></li>
                      <li><a className="underline-offset-2 hover:underline" href="#">Terms</a></li>
                      <li><a className="underline-offset-2 hover:underline" href="#">Contest Rules</a></li>
                    </ul>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm text-neutral-400">© {new Date().getFullYear()} Vancouver Mitsubishi. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* Accent bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: ACCENT }} aria-hidden="true" />
    </div>
  );
}

// --- DEV SELF-TESTS (non-production) ----------------------------------------
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const assert = (cond: boolean, msg: string) => { if (!cond) console.warn('[self-test]', msg); };
  // Existing tests
  assert(isValidEmail('test@example.com'), 'valid email should pass');
  assert(!isValidEmail('bad@'), 'invalid email should fail');
  assert(formatPhone('6045550199') === '(604) 555-0199', 'phone mask formats correctly');
  // Added tests
  assert(isValidEmail('alex+lead@sub.example.co'), 'email with + and subdomain should pass');
  assert(formatPhone('(604) 555-01991') === '(604) 555-0199', 'phone mask trims extra digits');
  assert(formatPhone('abc604-555-0199xyz') === '(604) 555-0199', 'phone mask ignores non-digits');
}
