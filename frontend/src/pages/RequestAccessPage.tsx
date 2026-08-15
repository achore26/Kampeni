import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, User, Mail, Phone, MapPin, Briefcase, MessageSquare } from 'lucide-react'

const ROLES = [
  'Campaign Manager',
  'Senator',
  'Member of Parliament',
  'Governor',
  'Woman Representative',
  'MCA',
  'Party Official',
  'Communications Director',
  'Other',
]

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi',
  'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
  'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
  'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
  'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
  'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira',
]

interface FormData {
  name: string
  email: string
  phone: string
  candidate: string
  county: string
  role: string
  message: string
}

const EMPTY: FormData = {
  name: '', email: '', phone: '', candidate: '', county: '', role: '', message: '',
}

export default function RequestAccessPage() {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

  function validate() {
    const e: Partial<FormData> = {}
    if (!form.name.trim())      e.name      = 'Required'
    if (!form.email.trim())     e.email     = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.candidate.trim()) e.candidate = 'Required'
    if (!form.county)           e.county    = 'Required'
    return e
  }

  function submit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const lines = [
      `Full Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone || '—'}`,
      `Candidate / Campaign: ${form.candidate}`,
      `County: ${form.county}`,
      `Role: ${form.role || '—'}`,
      `Message: ${form.message || '—'}`,
      '',
      '— Sent from kampeni.net/request-access',
    ]
    const subject = `Demo Request — ${form.candidate} (${form.county})`
    window.location.href = `mailto:hello@kampeni.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
    setSubmitted(true)
  }

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(er => ({ ...er, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <img
          src="/Kampeni_Logo_transparent.png"
          alt="Kampeni"
          className="h-7 w-auto"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="w-16" />
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {submitted ? (
            /* ── Success state ── */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Request sent!</h1>
              <p className="text-gray-500 text-sm mb-2">
                Your email client should have opened with your details pre-filled.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                We'll review your request and get back to you within 24 hours.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/demo"
                  className="px-5 py-2.5 rounded-full bg-[#1d4ed8] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors"
                >
                  Continue exploring demo
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* ── Heading ── */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Get access to Kampeni</h1>
                <p className="text-gray-500 mt-2">
                  Tell us about your campaign and we'll set up a personalised demo with live data for your candidate.
                </p>
              </div>

              {/* ── Form card ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Name" required
                    icon={<User className="w-4 h-4" />}
                    error={errors.name}
                  >
                    <input
                      type="text"
                      placeholder="Jane Mwangi"
                      value={form.name}
                      onChange={set('name')}
                      className={inputCls(errors.name)}
                    />
                  </Field>

                  <Field
                    label="Email Address" required
                    icon={<Mail className="w-4 h-4" />}
                    error={errors.email}
                  >
                    <input
                      type="email"
                      placeholder="jane@campaign.co.ke"
                      value={form.email}
                      onChange={set('email')}
                      className={inputCls(errors.email)}
                    />
                  </Field>
                </div>

                {/* Phone */}
                <Field label="Phone Number" icon={<Phone className="w-4 h-4" />}>
                  <input
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={form.phone}
                    onChange={set('phone')}
                    className={inputCls()}
                  />
                </Field>

                {/* Candidate + County */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Candidate / Campaign Name" required
                    icon={<Briefcase className="w-4 h-4" />}
                    error={errors.candidate}
                  >
                    <input
                      type="text"
                      placeholder="Hon. Jane Mwangi"
                      value={form.candidate}
                      onChange={set('candidate')}
                      className={inputCls(errors.candidate)}
                    />
                  </Field>

                  <Field
                    label="County" required
                    icon={<MapPin className="w-4 h-4" />}
                    error={errors.county}
                  >
                    <select
                      value={form.county}
                      onChange={set('county')}
                      className={inputCls(errors.county)}
                    >
                      <option value="">Select county</option>
                      {COUNTIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Role */}
                <Field label="Your Role">
                  <select
                    value={form.role}
                    onChange={set('role')}
                    className={inputCls()}
                  >
                    <option value="">Select your role</option>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>

                {/* Message */}
                <Field
                  label="Anything else we should know?"
                  icon={<MessageSquare className="w-4 h-4" />}
                >
                  <textarea
                    rows={3}
                    placeholder="Tell us about your campaign, upcoming elections, or what you'd like to track..."
                    value={form.message}
                    onChange={set('message')}
                    className={`${inputCls()} resize-none`}
                  />
                </Field>

                {/* Submit */}
                <button
                  onClick={submit}
                  className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm py-3.5 rounded-full transition-colors tracking-wide mt-2"
                >
                  Request Access
                </button>

                <p className="text-center text-xs text-gray-400">
                  We respond within 24 hours · Your details stay private
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label, required, icon, error, children,
}: {
  label: string; required?: boolean; icon?: React.ReactNode
  error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inputCls(error?: string) {
  return [
    'w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-gray-900',
    'placeholder:text-gray-400 outline-none transition-colors',
    'focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10',
    error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300',
  ].join(' ')
}
