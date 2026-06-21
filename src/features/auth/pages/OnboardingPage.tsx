import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useTheme } from '../../../app/providers/ThemeProvider'
import { supabase } from '../../../lib/supabase'
import type { TaxRegime, GoalMetric, Theme } from '../../../types/database'
import { Card } from '../../../shared/ui/Card'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { ArrowLeft, ArrowRight, Check, Building2, PiggyBank, Palette, User } from 'lucide-react'

const taxRegimes: { value: TaxRegime; label: string; desc: string }[] = [
  { value: 'occasional', label: 'Prestazione Occasionale', desc: 'Sotto 5.000€ annui, ritenuta d\'acconto 20%' },
  { value: 'vat_flat', label: 'Partita IVA Forfettario', desc: 'Coefficiente redditività, aliquota sostitutiva' },
  { value: 'vat_standard', label: 'Partita IVA Ordinario', desc: 'Contabilità ordinaria, IVA mensile/trimestrale' },
]

const goalMetrics: { value: GoalMetric; label: string }[] = [
  { value: 'net_settled', label: 'Netto incassato' },
  { value: 'gross_settled', label: 'Lordo incassato' },
  { value: 'gross_total', label: 'Lordo totale (in attesa + incassato)' },
  { value: 'cash_only', label: 'Solo cash' },
  { value: 'net_pending', label: 'Netto in attesa' },
]

const themes: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
]

const steps = [
  { id: 1, label: 'Dati Aziendali', icon: User },
  { id: 2, label: 'Regime Fiscale', icon: Building2 },
  { id: 3, label: 'Obiettivo', icon: PiggyBank },
  { id: 4, label: 'Preferenze', icon: Palette },
]

interface OnboardingData {
  fullName: string
  businessName: string
  vatNumber: string
  fiscalCode: string
  address: string
  taxRegime: TaxRegime
  financialGoal: number
  goalMetric: GoalMetric
  theme: Theme
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { setTheme: applyTheme } = useTheme()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    businessName: '',
    vatNumber: '',
    fiscalCode: '',
    address: '',
    taxRegime: 'occasional',
    financialGoal: 0,
    goalMetric: 'net_settled',
    theme: 'system',
  })

  function updateField<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    if (key === 'theme') {
      applyTheme(value as Theme)
    }
  }

  async function handleComplete() {
    if (!user) return
    setIsSubmitting(true)

    try {
      const currentYear = new Date().getFullYear()

      await supabase.from('profiles').update({
        full_name: data.fullName,
        business_name: data.businessName || null,
        vat_number: data.vatNumber || null,
        fiscal_code: data.fiscalCode || null,
        address: data.address || null,
        tax_regime: data.taxRegime,
        financial_goal: data.financialGoal,
        goal_metric: data.goalMetric,
        goal_data: {
          target: data.financialGoal,
          metric: data.goalMetric,
          segments: [
            { label: 'Netto', value: 0, color: '#6C5CE7' },
            { label: 'Lordo', value: 0, color: '#00D2FF' },
            { label: 'Cash', value: 0, color: '#00B894' },
          ],
        },
        dashboard_layout: [
          { id: 'kpi-group', order: 0, visible: true },
          { id: 'charts', order: 1, visible: true },
          { id: 'progress-rings', order: 2, visible: true },
          { id: 'bar-chart', order: 3, visible: true },
        ],
      }).eq('id', user.id)

      await supabase.from('fiscal_setups').upsert({
        user_id: user.id,
        year: currentYear,
        tax_regime: data.taxRegime,
        financial_goal: data.financialGoal,
        goal_metric: data.goalMetric,
        goal_data: {
          target: data.financialGoal,
          metric: data.goalMetric,
          segments: [
            { label: 'Netto', value: 0, color: '#6C5CE7' },
            { label: 'Lordo', value: 0, color: '#00D2FF' },
            { label: 'Cash', value: 0, color: '#00B894' },
          ],
        },
      }, { onConflict: 'user_id,year' })

      await supabase.from('user_settings').update({
        theme: data.theme,
      }).eq('user_id', user.id)

      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Onboarding error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return data.fullName.length >= 2
      case 2: return true
      case 3: return data.financialGoal > 0
      case 4: return true
      default: return false
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="space-y-6 md:space-y-8 p-5 md:p-8">
          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-bold">Benvenuto su NetFlow</h1>
            <p className="mt-1 md:mt-2 text-xs md:text-sm text-text-secondary">
              Configuriamo il tuo profilo in pochi passi
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 md:gap-2">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full text-[10px] md:text-xs font-bold transition-all shrink-0 ${
                      s.id === step
                        ? 'bg-brand text-white'
                        : s.id < step
                          ? 'bg-success/20 text-success'
                          : 'bg-surface text-text-secondary'
                    }`}
                  >
                    {s.id < step ? <Check className="h-3 md:h-4 w-3 md:w-4" /> : s.id}
                  </div>
                  <span className="hidden text-xs md:text-sm text-text-secondary md:inline">{s.label}</span>
                  {s.id < steps.length && <div className="h-px w-4 md:w-8 bg-border" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base md:text-lg font-semibold">Dati Aziendali</h2>
                  <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Input
                        label="Nome completo *"
                        placeholder="Mario Rossi"
                        value={data.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Ragione sociale"
                      placeholder="Azienda SRL"
                      value={data.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                    />
                    <Input
                      label="Partita IVA"
                      placeholder="01234567890"
                      value={data.vatNumber}
                      onChange={(e) => updateField('vatNumber', e.target.value)}
                    />
                    <Input
                      label="Codice Fiscale"
                      placeholder="RSSMRA80A01H501U"
                      value={data.fiscalCode}
                      onChange={(e) => updateField('fiscalCode', e.target.value)}
                    />
                    <Input
                      label="Indirizzo"
                      placeholder="Via Roma 1, Milano"
                      value={data.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base md:text-lg font-semibold">Regime Fiscale</h2>
                  <p className="text-xs md:text-sm text-text-secondary">
                    Seleziona il tuo regime fiscale. Puoi modificarlo in seguito dalle impostazioni.
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:gap-3">
                    {taxRegimes.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => updateField('taxRegime', r.value)}
                        className={`rounded-card border p-3 md:p-4 text-left transition-all ${
                          data.taxRegime === r.value
                            ? 'border-brand bg-brand/10'
                            : 'border-border bg-surface hover:border-brand/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm md:text-base">{r.label}</p>
                            <p className="text-xs md:text-sm text-text-secondary">{r.desc}</p>
                          </div>
                          {data.taxRegime === r.value && (
                            <div className="flex h-5 w-5 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-full bg-brand">
                              <Check className="h-3 md:h-4 w-3 md:w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-base md:text-lg font-semibold">Obiettivo Finanziario</h2>
                  <p className="text-xs md:text-sm text-text-secondary">
                    Imposta il tuo traguardo economico. Lo vedrai nella dashboard come tracker "a petali".
                  </p>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                    <div className="flex-1">
                      <Input
                        label="Importo obiettivo (€)"
                        type="number"
                        placeholder="50000"
                        value={data.financialGoal || ''}
                        onChange={(e) => updateField('financialGoal', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs md:text-sm text-text-secondary mb-1">Metrica</label>
                      <select
                        value={data.goalMetric}
                        onChange={(e) => updateField('goalMetric', e.target.value as GoalMetric)}
                        className="w-full rounded-input border border-border bg-surface px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        {goalMetrics.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-base md:text-lg font-semibold">Preferenze</h2>
                  <p className="text-xs md:text-sm text-text-secondary">
                    Scegli il tema che preferisci. Puoi cambiarlo in qualsiasi momento.
                  </p>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => updateField('theme', t.value)}
                        className={`flex-1 rounded-card border p-4 md:p-6 text-center transition-all ${
                          data.theme === t.value
                            ? 'border-brand bg-brand/10'
                            : 'border-border bg-surface hover:border-brand/50'
                        }`}
                      >
                        {t.value === 'dark' && '🌙'}
                        {t.value === 'light' && '☀️'}
                        {t.value === 'system' && '💻'}
                        <p className="mt-1 md:mt-2 font-medium text-sm md:text-base">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="text-xs md:text-sm"
            >
              <ArrowLeft className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
              Indietro
            </Button>

            {step < steps.length ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="text-xs md:text-sm">
                Avanti
                <ArrowRight className="ml-1 md:ml-2 h-3.5 md:h-4 w-3.5 md:w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting} className="text-xs md:text-sm">
                <Check className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
                {isSubmitting ? 'Salvataggio...' : 'Completa e inizia'}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
