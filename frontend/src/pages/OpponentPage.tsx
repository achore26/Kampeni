import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, X, TrendingUp, Building2 } from 'lucide-react'
import { apiClient } from '../api/client'

interface Opponent {
  id: string; name: string; constituency: string; party: string | null
  position: string | null; is_incumbent: boolean; mention_count: number
}
interface AddForm {
  name: string; constituency: string; party: string; position: string
  is_incumbent: boolean; aliases: string
}
const EMPTY: AddForm = { name: '', constituency: '', party: '', position: '', is_incumbent: false, aliases: '' }

export default function OpponentPage() {
  const { t } = useTranslation()
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    apiClient.get<Opponent[]>('/opponents/')
      .then((r) => setOpponents(r.data))
      .catch(() => setError(t('opponents.error')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.name || !form.constituency) return
    setSaving(true)
    try {
      await apiClient.post('/opponents/', {
        name: form.name, constituency: form.constituency,
        party: form.party || null, position: form.position || null,
        is_incumbent: form.is_incumbent,
        aliases: form.aliases ? form.aliases.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setForm(EMPTY); setShowForm(false); load()
    } catch { setError(t('opponents.saveError')) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-400 py-12">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      {t('opponents.loading')}
    </div>
  )

  const FIELDS = [
    { label: t('opponents.fullName'), key: 'name', placeholder: 'e.g. John Doe' },
    { label: t('opponents.constituency'), key: 'constituency', placeholder: 'e.g. Westlands' },
    { label: t('opponents.party'), key: 'party', placeholder: 'e.g. ODM, UDA' },
    { label: t('opponents.position'), key: 'position', placeholder: 'MP / MCA / Governor' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('opponents.title')}</h1>
          <p className="text-gray-500 mt-1">{t('opponents.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> {t('opponents.add')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && (
        <Card className="border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> {t('opponents.addTitle')}
            </CardTitle>
            <CardDescription>{t('opponents.addDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {FIELDS.map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                  <Input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('opponents.aliases')}</label>
                <Input value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} placeholder={t('opponents.aliasesPlaceholder')} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="incumbent" checked={form.is_incumbent}
                  onChange={(e) => setForm({ ...form, is_incumbent: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600" />
                <label htmlFor="incumbent" className="text-sm text-gray-700">{t('opponents.incumbent')}</label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAdd} disabled={saving || !form.name || !form.constituency}>
                {saving ? t('opponents.saving') : t('opponents.save')}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY) }}>
                {t('opponents.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {opponents.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('opponents.tracked'), value: opponents.length, color: 'text-gray-900' },
            { label: t('opponents.totalMentions'), value: opponents.reduce((s, o) => s + o.mention_count, 0), color: 'text-blue-600' },
            { label: t('opponents.incumbents'), value: opponents.filter(o => o.is_incumbent).length, color: 'text-yellow-600' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {opponents.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">{t('opponents.noOpponents')}</p>
              <p className="text-sm mt-1">{t('opponents.noOpponentsDesc')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {opponents.sort((a, b) => b.mention_count - a.mention_count).map((opp, i) => (
                <li key={opp.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-bold text-gray-300">#{i + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {opp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{opp.name}</span>
                        {opp.is_incumbent && <Badge variant="warning" className="text-xs">{t('opponents.incumbentBadge')}</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                        <Building2 className="w-3 h-3" />
                        {[opp.position, opp.party, opp.constituency].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TrendingUp className={`w-4 h-4 ${opp.mention_count > 0 ? 'text-blue-500' : 'text-gray-200'}`} />
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{opp.mention_count}</p>
                      <p className="text-xs text-gray-400">{t('opponents.mentions')}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
