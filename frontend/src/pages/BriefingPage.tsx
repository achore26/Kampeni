import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, BarChart2, Users, Clock, CheckCircle2 } from 'lucide-react'

const DONE = [true, true, true, true, false, false]

export default function BriefingPage() {
  const { t } = useTranslation()
  const features = t('briefing.features', { returnObjects: true }) as string[]

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('briefing.title')}</h1>
        <p className="text-gray-500 mt-1">{t('briefing.subtitle')}</p>
      </div>

      <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('briefing.coming')}</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
            {t('briefing.comingDesc')}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <NavLink to="/dashboard/sentiment">
              <Button className="gap-2">
                <BarChart2 className="w-4 h-4" /> {t('briefing.viewSentiment')}
              </Button>
            </NavLink>
            <NavLink to="/dashboard/opponents">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" /> {t('briefing.trackOpponents')}
              </Button>
            </NavLink>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> {t('briefing.progress')}
          </h3>
          <ul className="space-y-3">
            {features.map((label, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${DONE[i] ? 'text-green-500' : 'text-gray-200'}`} />
                <span className={DONE[i] ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
                {DONE[i] && (
                  <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {t('briefing.done')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
