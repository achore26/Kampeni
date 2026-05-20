import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { CheckCircle, Send, LogOut } from 'lucide-react'
import { apiClient } from '../api/client'

const SUPPORT_LEVELS = [
  { value: 'strong_support',    label: 'Msaada Mkubwa',   labelEn: 'Strong Support',    color: '#16a34a', bg: '#dcfce7' },
  { value: 'lean_support',      label: 'Msaada Kidogo',   labelEn: 'Lean Support',       color: '#22c55e', bg: '#f0fdf4' },
  { value: 'undecided',         label: 'Hawajaamua',      labelEn: 'Undecided',           color: '#9ca3af', bg: '#f9fafb' },
  { value: 'lean_opposition',   label: 'Upinzani Kidogo', labelEn: 'Lean Opposition',    color: '#f97316', bg: '#fff7ed' },
  { value: 'strong_opposition', label: 'Upinzani Mkubwa', labelEn: 'Strong Opposition',  color: '#dc2626', bg: '#fef2f2' },
]

const REPORT_TYPES = [
  { value: 'door_to_door',   label: 'Mlango kwa Mlango' },
  { value: 'rally',          label: 'Mkutano' },
  { value: 'market',         label: 'Soko' },
  { value: 'whatsapp_group', label: 'WhatsApp' },
  { value: 'incident',       label: 'Tukio' },
]

const TOP_ISSUES = [
  { value: 'jobs',        label: 'Ajira' },
  { value: 'water',       label: 'Maji' },
  { value: 'school_fees', label: 'Ada za Shule' },
  { value: 'roads',       label: 'Barabara' },
  { value: 'security',    label: 'Usalama' },
  { value: 'health',      label: 'Afya' },
  { value: 'other',       label: 'Nyingine' },
]

interface FormState {
  ward: string
  report_type: string
  top_issue: string
  support_level: string
  notes: string
}

const EMPTY: FormState = {
  ward: '',
  report_type: '',
  top_issue: '',
  support_level: '',
  notes: '',
}

export default function FieldSubmitPage() {
  const { user, logout } = useAuth0()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormState, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const canSubmit =
    form.ward.trim() && form.report_type && form.top_issue && form.support_level

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await apiClient.post('/intake/field-report', {
        ward: form.ward.trim(),
        report_type: form.report_type,
        top_issue: form.top_issue,
        support_level: form.support_level,
        notes: form.notes.trim() || null,
      })
      setSuccess(true)
      setForm(EMPTY)
    } catch {
      setError('Imeshindwa kutuma — jaribu tena')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Kampeni</p>
          <p className="text-base font-bold text-gray-900 leading-tight">Ripoti ya Shambani</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{user?.name}</p>
            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{user?.email}</p>
          </div>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/login' } })}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success state */}
      {success && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ripoti Imetumwa!</h2>
          <p className="text-gray-500 mb-8">Asante. Ripoti yako imefika kwa timu ya kampeni.</p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full max-w-xs py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-base"
          >
            Tuma Ripoti Nyingine
          </button>
        </div>
      )}

      {/* Form */}
      {!success && (
        <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">

          {/* Ward */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kata <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.ward}
              onChange={e => set('ward', e.target.value)}
              placeholder="e.g. Kibera, Mathare North"
              className={inputClass}
            />
          </div>

          {/* Report type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Aina ya Ripoti <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => set('report_type', rt.value)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border-2 transition-all text-center ${
                    form.report_type === rt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top issue */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tatizo Kuu <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TOP_ISSUES.map(issue => (
                <button
                  key={issue.value}
                  onClick={() => set('top_issue', issue.value)}
                  className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                    form.top_issue === issue.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {issue.label}
                </button>
              ))}
            </div>
          </div>

          {/* Support level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kiwango cha Msaada <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {SUPPORT_LEVELS.map(sl => (
                <button
                  key={sl.value}
                  onClick={() => set('support_level', sl.value)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left"
                  style={form.support_level === sl.value
                    ? { borderColor: sl.color, background: sl.bg }
                    : { borderColor: '#e5e7eb', background: 'white' }
                  }
                >
                  <span className="text-sm font-semibold" style={{
                    color: form.support_level === sl.value ? sl.color : '#374151'
                  }}>
                    {sl.label}
                  </span>
                  <span className="text-xs text-gray-400">{sl.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Maelezo Zaidi <span className="text-gray-400 font-normal">(si lazima)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Maoni ya ziada kutoka kwa wananchi..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-4 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: canSubmit && !submitting ? '#1d4ed8' : '#93c5fd',
            }}
          >
            {submitting
              ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Inatuma...</>
              : <><Send className="w-5 h-5" /> Tuma Ripoti</>
            }
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Ripoti zinakwenda moja kwa moja kwa timu ya kampeni
          </p>
        </div>
      )}
    </div>
  )
}
