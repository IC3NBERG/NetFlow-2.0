import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Toast } from '../../../shared/ui/Toast'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useTheme } from '../../../app/providers/ThemeProvider'
import { useSync } from '../../../app/providers/SyncProvider'
import { useUserSettings, useUpdateUserSettings } from '../../../lib/hooks/useUserSettings'
import { useUpdateProfile } from '../../../lib/hooks/useProfile'
import { useJobs } from '../../../lib/hooks/useJobs'
import { useFiscalSetup, useUpsertFiscalSetup } from '../../../lib/hooks/useFiscalSetup'
import { setSyncEnabled } from '../../../lib/syncBridge'
import { useFiscalYearStore } from '../../../lib/stores/fiscalYear'
import { supabase } from '../../../lib/supabase'
import {
  User, Moon, Sun, Monitor, RefreshCw, Download, Upload, Bell, Database,
  FileText, Shield, Save, AlertTriangle, Calendar,
} from 'lucide-react'
import { type Theme, type TaxRegime, type GoalMetric } from '../../../types/database'
import { exportToCSV, exportToJSON } from '../../../lib/export'
import { backupFileSchema } from '../../../lib/validations'
import { hardResetPwa } from '../../../lib/pwaReset'
import { cn } from '../../../lib/utils'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null
type SettingsTab = 'profile' | 'preferences' | 'invoices' | 'backup' | 'legal'

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
]

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profilo', icon: User },
  { id: 'preferences', label: 'Preferenze', icon: Moon },
  { id: 'invoices', label: 'Fatture', icon: FileText },
  { id: 'backup', label: 'Backup', icon: Database },
  { id: 'legal', label: 'Privacy', icon: Shield },
]

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { user, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { isOnline, queueLength, forceSync, isSyncing } = useSync()
  const { data: settings, isLoading: settingsLoading } = useUserSettings()
  const { data: jobs = [] } = useJobs()
  const updateSettings = useUpdateUserSettings()
  const updateProfile = useUpdateProfile()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [toast, setToast] = useState<ToastState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [businessName, setBusinessName] = useState(user?.business_name ?? '')
  const [vatNumber, setVatNumber] = useState(user?.vat_number ?? '')
  const [fiscalCode, setFiscalCode] = useState(user?.fiscal_code ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(user?.tax_regime ?? 'occasional')
  const [invoiceHeader, setInvoiceHeader] = useState(user?.business_name ?? '')
  const [invoiceFooter, setInvoiceFooter] = useState('')
  const { data: fiscalSetup } = useFiscalSetup()
  const upsertFiscalSetup = useUpsertFiscalSetup()
  const fiscalYear = useFiscalYearStore((s) => s.year)
  const [fiscalGoal, setFiscalGoal] = useState(fiscalSetup?.financial_goal ?? user?.financial_goal ?? 0)
  const [fiscalGoalMetric, setFiscalGoalMetric] = useState<GoalMetric>(fiscalSetup?.goal_metric ?? user?.goal_metric ?? 'net_settled')
  const [customIrpefRate, setCustomIrpefRate] = useState(fiscalSetup?.custom_irpef_rate ?? null)

  useEffect(() => {
    if (user) {
      setInvoiceHeader(user.business_name ?? '')
      const footer = user.goal_data && typeof user.goal_data === 'object' && 'invoice_footer' in user.goal_data
        ? String((user.goal_data as { invoice_footer?: string }).invoice_footer ?? '')
        : ''
      setInvoiceFooter(footer)
    }
  }, [user])

  useEffect(() => {
    if (fiscalSetup) {
      setFiscalGoal(fiscalSetup.financial_goal)
      setFiscalGoalMetric(fiscalSetup.goal_metric)
      setCustomIrpefRate(fiscalSetup.custom_irpef_rate)
    }
  }, [fiscalSetup])

  async function handleSaveInvoiceTemplate() {
    if (!user) return
    setIsSubmitting(true)
    try {
      const goalData = {
        ...(user.goal_data ?? { target: 0, metric: 'net_settled' as GoalMetric, segments: [] }),
        invoice_footer: invoiceFooter || undefined,
      }
      await updateProfile.mutateAsync({
        id: user.id,
        business_name: invoiceHeader || null,
        goal_data: goalData,
      })
      await refreshProfile()
      setToast({ message: 'Template fattura salvato', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante il salvataggio del template', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogoUpload() {
    if (!user) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Logo troppo grande (max 2MB)', type: 'error' })
        return
      }
      try {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/logo.${ext}`
        const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
        await updateProfile.mutateAsync({ id: user.id, logo_url: urlData.publicUrl })
        await refreshProfile()
        setToast({ message: 'Logo caricato con successo', type: 'success' })
      } catch {
        setToast({ message: 'Errore caricamento logo — verifica il bucket storage "logos"', type: 'error' })
      }
    }
    input.click()
  }

  async function handleHardResetPwa() {
    if (!window.confirm('Forzare aggiornamento PWA e svuotare la cache locale?')) return
    setToast({ message: 'Sincronizzazione forzata in corso...', type: 'info' })
    await hardResetPwa(queryClient)
  }

  async function handleSaveProfile() {
    if (!user) return
    setIsSubmitting(true)
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        full_name: fullName || null,
        business_name: businessName || null,
        vat_number: vatNumber || null,
        fiscal_code: fiscalCode || null,
        address: address || null,
        tax_regime: taxRegime,
      })

      await upsertFiscalSetup.mutateAsync({
        year: fiscalYear,
        tax_regime: taxRegime,
        financial_goal: fiscalGoal,
        goal_metric: fiscalGoalMetric,
        custom_irpef_rate: customIrpefRate,
      })

      await refreshProfile()
      setToast({ message: 'Profilo aggiornato con successo', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante il salvataggio', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleSetting(key: string, value: boolean) {
    try {
      await updateSettings.mutateAsync({ [key]: value })
      if (key === 'sync_enabled') setSyncEnabled(value)
      setToast({ message: 'Impostazione aggiornata', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante l\'aggiornamento', type: 'error' })
    }
  }

  const handleExportCSV = useCallback(() => {
    try {
      exportToCSV(jobs.map((j) => ({ ...j, client_name: null })) as never[])
      setToast({ message: 'CSV esportato con successo', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante l\'esportazione', type: 'error' })
    }
  }, [jobs])

  const handleExportJSON = useCallback(() => {
    try {
      exportToJSON(jobs.map((j) => ({ ...j, client_name: null })) as never[])
      setToast({ message: 'JSON esportato con successo', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante l\'esportazione', type: 'error' })
    }
  }, [jobs])

  async function handleRestore() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File troppo grande (max 10MB)')
        }

        const text = await file.text()
        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch {
          throw new Error('File JSON non valido: errore di parsing')
        }

        const result = backupFileSchema.safeParse(parsed)
        if (!result.success) {
          const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
          throw new Error(`Validazione fallita: ${errors}`)
        }

        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error('Utente non autenticato')
        const userId = userData.user.id

        const hasInjection = result.data.some((item) => {
          const values = Object.values(item).filter(Boolean).map(String)
          return values.some((v) => /<script|javascript:|onerror=|onload=|--\s/.test(v.toLowerCase()))
        })
        if (hasInjection) {
          throw new Error('Rilevati dati potenzialmente pericolosi nel file di backup')
        }

        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .eq('user_id', userId)
        if (deleteError) throw new Error('Errore durante la pulizia dati esistenti')

        const jobs = result.data.map((item) => ({
          user_id: userId,
          client_id: item.client_id ?? null,
          title: item.title,
          description: item.description ?? null,
          status: item.status,
          payment_method: item.payment_method,
          amount_card: item.amount_card,
          amount_cash: item.amount_cash,
          net_amount: item.net_amount ?? 0,
          include_cash_in_invoice: item.include_cash_in_invoice,
          start_date: item.start_date ?? item.date ?? new Date().toISOString().slice(0, 10),
          pending_date: item.pending_date ?? null,
          end_date: item.end_date ?? null,
        }))

        if (jobs.length > 0) {
          const { error: insertError } = await supabase.from('jobs').insert(jobs)
          if (insertError) throw new Error('Errore durante il ripristino: ' + insertError.message)
        }

        setToast({ message: `Ripristino completato: ${jobs.length} lavori importati con user_id forzato`, type: 'success' })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } catch (err) {
        setToast({ message: err instanceof Error ? err.message : 'File di backup non valido', type: 'error' })
      }
    }
    input.click()
  }

  const legalSections = [
    {
      icon: Shield,
      title: 'Informativa Privacy',
      content: `I tuoi dati personali e finanziari vengono trattati esclusivamente per fornire il servizio di tracciamento contabile. I dati sono memorizzati su server crittografati (AES-256) e trasmessi via HTTPS. Base giuridica: esecuzione del contratto (art. 6.1.b GDPR) e adempimento obblighi fiscali (art. 6.1.c GDPR).`,
    },
    {
      icon: AlertTriangle,
      title: 'Cookie Policy',
      content: `Utilizziamo solo cookie tecnici necessari: cookie di sessione per autenticazione, cookie di preferenza per il tema (365 giorni), Local Storage per preferenze offline. Nessun cookie di profilazione o marketing.`,
    },
    {
      icon: Database,
      title: 'Conservazione Dati',
      content: `I dati finanziari sono conservati per 10 anni ai fini fiscali (DPR 600/73, art. 2220 CC). Alla cancellazione dell'account, tutti i dati vengono rimossi entro 30 giorni, salvi obblighi di legge.`,
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">Centro Impostazioni</h2>
        <p className="text-xs md:text-sm text-text-secondary">Gestisci profilo, preferenze e impostazioni</p>
      </div>

      <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 -mx-4 md:mx-0 px-4 md:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1 md:gap-2 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all shrink-0',
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profile' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                <h3 className="text-base md:text-lg font-semibold">Profilo</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input label="Nome completo" placeholder="Mario Rossi" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <Input label="Ragione sociale" placeholder="Azienda SRL" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                <Input label="Partita IVA" placeholder="01234567890" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                <Input label="Codice Fiscale" placeholder="RSSMRA80A01H501U" value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} />
                <Input label="Indirizzo" placeholder="Via Roma 1, Milano" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Regime fiscale</label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                    className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="occasional">Prestazione Occasionale</option>
                    <option value="vat_flat">Regime Forfettario</option>
                    <option value="vat_standard">Regime Ordinario</option>
                  </select>
                  <p className="text-xs text-text-secondary mt-1">La guida fiscale si adatterà automaticamente al regime scelto</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-brand" />
                  <h4 className="text-sm font-semibold">Obiettivo finanziario {fiscalYear}</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label={`Obiettivo finanziario ${fiscalYear} (€)`}
                    type="number"
                    placeholder="50000"
                    value={fiscalGoal || ''}
                    onChange={(e) => setFiscalGoal(Number(e.target.value))}
                  />
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Metrica obiettivo</label>
                    <select
                      value={fiscalGoalMetric}
                      onChange={(e) => setFiscalGoalMetric(e.target.value as GoalMetric)}
                      className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option value="net_settled">Netto incassato</option>
                      <option value="gross_settled">Lordo incassato</option>
                      <option value="gross_total">Lordo totale (in attesa + incassato)</option>
                      <option value="cash_only">Solo cash</option>
                      <option value="net_pending">Netto in attesa</option>
                    </select>
                  </div>
                </div>
                {taxRegime === 'vat_standard' && (
                  <div>
                    <Input
                      label="Aliquota IRPEF stimata (%)"
                      type="number"
                      step="0.01"
                      placeholder="30"
                      value={customIrpefRate ?? ''}
                      onChange={(e) => setCustomIrpefRate(e.target.value ? Number(e.target.value) : null)}
                    />
                    <p className="text-xs text-text-secondary mt-1">Usata per calcolare il lordo dal netto nei lavori</p>
                  </div>
                )}
                <p className="text-xs text-text-secondary mt-2">
                  L'obiettivo è isolato per anno fiscale. La modifica non influisce sui periodi passati.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={isSubmitting} className="text-xs md:text-sm">
                  <Save className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
                  {isSubmitting ? 'Salvataggio...' : 'Salva profilo'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'preferences' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <Moon className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                <h3 className="text-base md:text-lg font-semibold">Tema</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {themes.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`flex items-center justify-center gap-2 rounded-card border px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all ${
                        theme === t.value
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border bg-surface text-text-secondary hover:border-brand/50'
                      }`}
                    >
                      <Icon className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 md:h-5 w-4 md:w-5 text-[#00D2FF]" />
                <h3 className="text-base md:text-lg font-semibold">Sincronizzazione</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-xs md:text-sm">Stato: <span className={isOnline ? 'text-success' : 'text-expense'}>{isOnline ? 'Online' : 'Offline'}</span></p>
                  {queueLength > 0 && <p className="text-xs md:text-sm text-text-secondary">{queueLength} operazioni in coda</p>}
                  {isSyncing && <p className="text-xs md:text-sm text-brand">Sincronizzazione in corso...</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={forceSync} disabled={!isOnline || isSyncing} variant="secondary" className="text-xs md:text-sm">
                    <RefreshCw className={`mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronizza ora
                  </Button>
                  <Button onClick={handleHardResetPwa} variant="secondary" className="text-xs md:text-sm">
                    <RefreshCw className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
                    Hard reset
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="h-4 md:h-5 w-4 md:w-5 text-[#F59E0B]" />
                <h3 className="text-base md:text-lg font-semibold">Notifiche e preferenze</h3>
              </div>
              {settingsLoading ? (
                <p className="text-sm text-text-secondary">Caricamento...</p>
              ) : (
                  <div className="space-y-3 md:space-y-4">
                  <label className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium">Notifiche</p>
                      <p className="text-[10px] md:text-xs text-text-secondary">Avvisi per backup, sync e scadenze</p>
                    </div>
                    <input type="checkbox" checked={settings?.notifications_enabled ?? true}
                      onChange={(e) => handleToggleSetting('notifications_enabled', e.target.checked)}
                      className="h-4 w-4 md:h-5 md:w-5 rounded border-border bg-surface text-brand focus:ring-brand shrink-0" />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium">Sincronizzazione automatica</p>
                      <p className="text-[10px] md:text-xs text-text-secondary">Sincronizza automaticamente online</p>
                    </div>
                    <input type="checkbox" checked={settings?.sync_enabled ?? true}
                      onChange={(e) => handleToggleSetting('sync_enabled', e.target.checked)}
                      className="h-4 w-4 md:h-5 md:w-5 rounded border-border bg-surface text-brand focus:ring-brand shrink-0" />
                  </label>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'invoices' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-4 md:h-5 w-4 md:w-5 text-[#00D2FF]" />
                <h3 className="text-base md:text-lg font-semibold">Personalizzazione Fatture</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">Configura il template delle tue parcelle e fatture</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Intestazione documento" placeholder="Il tuo nome / azienda" value={invoiceHeader} onChange={(e) => setInvoiceHeader(e.target.value)} />
                <Input label="Piè di pagina" placeholder="Grazie per la collaborazione" value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <Button variant="secondary" onClick={handleLogoUpload} className="text-xs md:text-sm"><Upload className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />Carica logo</Button>
                <Button onClick={handleSaveInvoiceTemplate} disabled={isSubmitting} className="text-xs md:text-sm"><Save className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />Salva template</Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'backup' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <Download className="h-4 md:h-5 w-4 md:w-5 text-success" />
                <h3 className="text-base md:text-lg font-semibold">Esportazione dati</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">Esporta i tuoi dati in formato CSV o JSON</p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button variant="secondary" onClick={handleExportCSV} className="text-xs md:text-sm"><Download className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />CSV</Button>
                <Button variant="secondary" onClick={handleExportJSON} className="text-xs md:text-sm"><Database className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />JSON</Button>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <Upload className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                <h3 className="text-base md:text-lg font-semibold">Ripristino dati</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">Carica un file JSON di backup per ripristinare i dati</p>
              <div>
                <Button variant="secondary" onClick={handleRestore} className="text-xs md:text-sm"><Upload className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />Carica backup</Button>
              </div>
              <div className="rounded-card border border-border bg-surface/50 px-4 py-3">
                <p className="text-xs text-text-secondary">
                  <AlertTriangle className="inline h-3 w-3 mr-1 text-[#F59E0B]" />
                  Il ripristino valida automaticamente lo schema del file JSON e forza l'user_id dell'utente corrente per prevenire accesso a dati altrui.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'legal' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {legalSections.map((section) => {
            const Icon = section.icon
            return (
              <motion.div key={section.title} variants={itemAnim}>
                <GlassCard className="p-4 md:p-6 space-y-2 md:space-y-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                    <h3 className="text-base md:text-lg font-semibold">{section.title}</h3>
                  </div>
                  <p className="text-xs md:text-sm text-text-secondary leading-relaxed">{section.content}</p>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
