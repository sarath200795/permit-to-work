import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, HardHat } from 'lucide-react'
import { LEGAL, LEGAL_PAGES } from '../lib/legal'

const { companyName, productName, contactEmail, jurisdiction, effectiveDate } = LEGAL

// A block is { h?: heading, p?: paragraph, list?: [items] }.
const SECTIONS = {
  privacy: {
    title: 'Privacy Policy',
    intro: `This Privacy Policy explains how ${companyName} ("we") collects, uses, and protects information in ${productName} (the "Service") — a digital permit-to-work system for high-risk work.`,
    blocks: [
      { h: 'Information we collect', list: [
        'Account information you provide: your name, email address and phone number.',
        'Organization information: organization name, address, work sites, and the roles an admin assigns.',
        'Permit records you enter: date/time, type of work, site, location, job description, hazards, PPE and precautions, the Job Safety Analysis, issued-to person, and participants (internal teammates and external personnel — including names and contact details you add), fire watchers and confined-space attendants.',
        'Documents you attach to a permit (e.g. risk assessments, method statements, gas-test records) — stored as files within your organization’s records.',
        'Safety observations logged via QR scan or in-app: the Safe/Unsafe type, your note, and your identity as the observer.',
        'An immutable audit log of actions (who did what, and when).',
      ] },
      { h: 'How we use it', p: 'We use this information solely to provide the Service: raising and approving permits, running the extension/closure and observation workflows, generating dashboards and reports, producing printable/QR-scannable permits, and maintaining an audit trail. We do not sell your data or use it for advertising.' },
      { h: 'Storage & processing', p: 'Data is stored in Google Firebase (Cloud Firestore and Firebase Authentication). Attached documents are stored within Firestore. Each organization’s records are logically isolated, and access is restricted by security rules so that only approved members of an organization can read its data.' },
      { h: 'Public QR pages', p: 'Each permit has a QR code linking to a public page that, by design, displays that permit’s details and live status (and a countdown) so anyone scanning it on site can view it. Participant names you add may appear there. Logging an observation requires the viewer to sign in. Do not encode sensitive personal data into permit fields you would not want visible to a scanner.' },
      { h: 'AI assistant ("Sam")', p: 'The in-app Safety Bot answers from your live data using built-in rules. If an AI fallback is configured by your operator, a question you type plus a compact, non-identifying snapshot of your permit figures may be sent to a third-party model provider (Google Gemini) to generate a reply; it is not used to train models. With no AI key configured, the assistant runs entirely on local rules.' },
      { h: 'Retention & deletion', p: 'Records are retained while your organization uses the Service. See the Data Retention page for details and how to request export or deletion.' },
      { h: 'Your rights & contact', p: `To request access, export, correction, or deletion of your data, contact us at ${contactEmail}.` },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: `These Terms govern your use of ${productName}, provided by ${companyName}. By using the Service you agree to them.`,
    blocks: [
      { h: 'Acceptable use', p: 'You may use the Service only for lawful permit-to-work record-keeping for your own organization. You are responsible for the accuracy of the data you enter and for the actions of the users you approve.' },
      { h: 'Accounts & organizations', p: 'The first user of an organization is its administrator and approves additional members, assigning each a role (Engineering, Operations or Technician). Administrators are responsible for managing access, roles, and the organization’s data.' },
      { h: 'Not a substitute for real-world safety controls', p: `${productName} is a documentation and authorization aid ONLY. It does NOT perform, verify, certify, or replace physical isolation, atmospheric/gas testing, equipment inspection, on-site supervision, rescue arrangements, or any legal/regulatory compliance obligation. A permit recorded as "approved" is an administrative record — you remain solely responsible for ensuring the actual controls, competent persons, and conditions are in place and that work is carried out safely and lawfully (e.g. under HSE/OSHA and applicable standards).` },
      { h: 'Guidance & AI answers', p: 'Any safety guidance, reminders, status derivations, or AI-assistant ("Sam") answers are provided for convenience and may be incomplete or inaccurate. Always verify against official standards and a competent person before acting.' },
      { h: 'Disclaimer of warranties', p: 'The Service is provided "AS IS" and "AS AVAILABLE", without warranties of any kind, express or implied, including fitness for a particular purpose and accuracy of status, validity-window, or expiry calculations.' },
      { h: 'Limitation of liability', p: `To the maximum extent permitted by law, ${companyName} shall not be liable for any indirect, incidental, or consequential damages, or for any loss arising from reliance on the Service, including any incident, injury, missed control, or compliance failure.` },
      { h: 'Governing law', p: `These Terms are governed by the laws of ${jurisdiction}.` },
      { h: 'Contact', p: `Questions about these Terms: ${contactEmail}.` },
    ],
  },
  retention: {
    title: 'Data Retention & Deletion',
    intro: 'This describes how long data is kept and how to remove it.',
    blocks: [
      { h: 'Active records', p: 'Permits, observations, attached documents, and organization data are retained for as long as your organization uses the Service.' },
      { h: 'Attached documents', p: 'Documents you attach are stored within the permit record. Removing a document from a permit deletes that file; deleting a permit (admin only) removes its records.' },
      { h: 'Public QR mirror', p: 'Each permit has a minimal public copy (the "mirror") that powers its QR scan page and reflects its current status. If a permit is deleted, contact us to purge its public mirror.' },
      { h: 'Audit log', p: 'The audit log is append-only and immutable: entries cannot be edited or deleted, by design, to preserve an accurate compliance trail.' },
      { h: 'Observations', p: 'Safety observations are kept as a permanent safety record; an unsafe observation also closes its permit for non-compliance and that outcome is retained.' },
      { h: 'Requesting deletion', p: `To request deletion of your account or your organization’s data, contact ${contactEmail}.` },
    ],
  },
  cookies: {
    title: 'Cookies & Storage',
    intro: `${productName} keeps browser storage to a minimum.`,
    blocks: [
      { h: 'What we store', p: 'We use Firebase Authentication, which stores a session token in your browser to keep you signed in. We use session persistence, so the token is dropped when you close the tab/browser. This is strictly necessary for the Service to function.' },
      { h: 'Local preferences', p: 'The Safety Bot stores small UI preferences in your browser’s local storage (whether it is shown, its position, and which tips you have seen), under keys prefixed "ptw:bot:". These are functional only and never leave your device.' },
      { h: 'What we do NOT use', p: 'We do not use third-party advertising or cross-site tracking cookies, and we do not run analytics that profile you across other websites.' },
      { h: 'Managing it', p: 'Signing out clears your session. Clearing your browser’s site data for this app removes the stored token and preferences.' },
      { h: 'Contact', p: `Questions: ${contactEmail}.` },
    ],
  },
}

export default function Legal({ kind = 'privacy' }) {
  const section = SECTIONS[kind] || SECTIONS.privacy

  return (
    <div className="aurora min-h-screen px-4 py-10 text-white">
      <motion.div
        className="mx-auto w-full max-w-3xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat size={22} className="text-brand-300" />
            <span className="text-lg font-extrabold tracking-tight">{productName}</span>
          </div>
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft size={15} /> Back to login
          </Link>
        </div>

        <div className="rounded-3xl bg-clay-surface p-6 text-ink-800 shadow-clay sm:p-9">
          <div className="mb-1 flex items-center gap-2 text-brand-600">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{section.title}</h1>
          <p className="mt-1 text-sm text-ink-400">Effective date: {effectiveDate}</p>
          {section.intro && <p className="mt-4 text-ink-600">{section.intro}</p>}

          <div className="mt-6 space-y-6">
            {section.blocks.map((b, i) => (
              <section key={i}>
                {b.h && <h2 className="text-base font-bold text-ink-900">{b.h}</h2>}
                {b.p && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{b.p}</p>}
                {b.list && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-600">
                    {b.list.map((it, j) => <li key={j}>{it}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Cross-links to the other legal pages */}
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-clay-200 pt-5 text-sm">
            {LEGAL_PAGES.map((p) => (
              <Link
                key={p.kind}
                to={p.path}
                className={`font-semibold ${p.kind === kind ? 'text-ink-400' : 'text-brand-600 hover:underline'}`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {productName}. A documentation &amp; authorization aid — not a substitute for on-site verification of safety controls.
        </p>
      </motion.div>
    </div>
  )
}
