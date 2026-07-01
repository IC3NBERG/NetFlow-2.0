import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Toast } from '../../../shared/ui/Toast'
import { useAuth } from '../../../app/providers/AuthProvider'

import { useSync } from '../../../app/providers/SyncProvider'
import { useUserSettings, useUpdateUserSettings } from '../../../lib/hooks/useUserSettings'
import { useUpdateProfile } from '../../../lib/hooks/useProfile'
import { useJobs } from '../../../lib/hooks/useJobs'
import { useFiscalSetup, useUpsertFiscalSetup } from '../../../lib/hooks/useFiscalSetup'
import { setSyncEnabled } from '../../../lib/syncBridge'
import { useFiscalYearStore } from '../../../lib/stores/fiscalYear'
import { supabase } from '../../../lib/supabase'
import { SharesManager } from '../components/SharesManager'
import { AuditLogViewer } from '../components/AuditLogViewer'
import {
  User, RefreshCw, Download, Upload, Bell, Database,
  FileText, Save, AlertTriangle, Calendar, Share2, History, Goal, TrendingUp,
  Trash2,
} from 'lucide-react'
import { type TaxRegime, type GoalMetric, type NotificationCategory } from '../../../types/database'
import { useNotificationPreference, useUpdateNotificationPreference } from '../../../lib/hooks/useUserSettings'
import { exportToCSV, exportToJSON } from '../../../lib/export'
import { backupFileSchema } from '../../../lib/validations'
import { hardResetPwa } from '../../../lib/pwaReset'
import { cn } from '../../../lib/utils'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null
type SettingsTab = 'profile' | 'notifications' | 'invoices' | 'backup' | 'sharing' | 'audit'



const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profilo', icon: User },
  { id: 'notifications', label: 'Notifiche', icon: Bell },
  { id: 'invoices', label: 'Fatture', icon: FileText },
  { id: 'backup', label: 'Backup', icon: Database },
  { id: 'sharing', label: 'Condivisione', icon: Share2 },
  { id: 'audit', label: 'Audit Log', icon: History },
]

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { user, refreshProfile } = useAuth()

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

  async function handleToggleSetting(key: string, value: boolean | number) {
    try {
      await updateSettings.mutateAsync({ [key]: value })
      if (key === 'sync_enabled') setSyncEnabled(value as boolean)
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

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) throw new Error('Utente non autenticato')
        const userId = session.user.id

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

  function NotificationToggle({
    label, description, enabled, icon: Icon, onChange,
  }: {
    label: string; description: string; enabled: boolean; icon: typeof Bell; onChange: (v: boolean) => void
  }) {
    return (
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Icon className="h-4 w-4 mt-0.5 text-text-secondary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium">{label}</p>
            <p className="text-[10px] md:text-xs text-text-secondary">{description}</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 md:h-5 md:w-5 rounded border-border bg-surface text-brand focus:ring-brand shrink-0 cursor-pointer"
        />
      </label>
    )
  }

  function NotificationCategoryToggle({ category, label, description, icon: Icon }: {
    category: NotificationCategory; label: string; description: string; icon: typeof Bell
  }) {
    const enabled = useNotificationPreference(category)
    const updatePref = useUpdateNotificationPreference()
    return (
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Icon className="h-4 w-4 mt-0.5 text-text-secondary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium">{label}</p>
            <p className="text-[10px] md:text-xs text-text-secondary">{description}</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => updatePref.mutate({ category, enabled: e.target.checked })}
          className="h-4 w-4 md:h-5 md:w-5 rounded border-border bg-surface text-brand focus:ring-brand shrink-0 cursor-pointer"
        />
      </label>
    )
  }


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
        <p className="text-xs md:text-sm text-text-secondary">Gestisci profilo, notifiche e impostazioni</p>
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
                  : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
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

          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-pending" />
                <h3 className="text-base md:text-lg font-semibold">Pulisci account</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">
                Cancella tutti i dati finanziari (lavori, fatture, clienti, spese, preventivi, audit log, condivisioni, eventi). Il profilo rimane intatto.
              </p>
              <Button variant="danger" onClick={async () => {
                if (!window.confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa azione è irreversibile.')) return
                if (!window.confirm('CONFERMA FINALE: tutti i dati finanziari verranno cancellati permanentemente. Il profilo resterà attivo.')) return
                const { error } = await supabase.rpc('clean_user_data')
                if (error) {
                  setToast({ message: 'Errore durante la pulizia. Contatta il supporto.', type: 'error' })
                } else {
                  setToast({ message: 'Tutti i dati cancellati con successo', type: 'success' })
                  queryClient.invalidateQueries()
                }
              }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Pulisci account
              </Button>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-expense" />
                <h3 className="text-base md:text-lg font-semibold">Eliminazione account</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">
                Elimina permanentemente il tuo account e tutti i dati associati. Azione irreversibile — art. 17 GDPR (diritto all'oblio).
              </p>
              <Button variant="danger" onClick={async () => {
                if (!window.confirm('Sei sicuro di voler eliminare il tuo account? I dati verranno persi definitivamente.')) return
                if (!window.confirm('CONFERMA FINALE: questa azione è irreversibile. Tutti i dati finanziari e il profilo verranno cancellati. Non potrai più accedere.')) return
                const { error } = await supabase.rpc('delete_user_account')
                if (error) {
                  setToast({ message: 'Errore durante l\'eliminazione. Contatta il supporto.', type: 'error' })
                } else {
                  setToast({ message: 'Account eliminato con successo', type: 'success' })
                  window.location.href = '/login'
                }
              }}>
                <Trash2 className="h-4 w-4 mr-2" /> Elimina account
              </Button>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">


          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 md:h-5 w-4 md:w-5 text-brand/70" />
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
                <Bell className="h-4 md:h-5 w-4 md:w-5 text-pending" />
                <h3 className="text-base md:text-lg font-semibold">Notifiche</h3>
              </div>
              {settingsLoading ? (
                <p className="text-sm text-text-secondary">Caricamento...</p>
              ) : (
                <div className="space-y-4 md:space-y-5">
                  <NotificationToggle
                    label="Notifiche globali"
                    description="Abilita o disabilita tutte le notifiche"
                    enabled={settings?.notifications_enabled ?? true}
                    icon={Bell}
                    onChange={(v) => handleToggleSetting('notifications_enabled', v)}
                  />
                  {settings?.notifications_enabled !== false && (
                    <>
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">
                          Categorie
                        </p>
                        <div className="space-y-3">
                          <NotificationCategoryToggle
                            category="deadline"
                            label="Scadenze lavori"
                            description="Lavori in attesa di pagamento da oltre 30 giorni"
                            icon={Calendar}
                          />
                          <NotificationCategoryToggle
                            category="invoice"
                            label="Fatture scadute"
                            description="Fatture non pagate oltre la data di scadenza"
                            icon={AlertTriangle}
                          />
                          <NotificationCategoryToggle
                            category="backup"
                            label="Backup"
                            description="Promemoria per esportazione dati periodica"
                            icon={Download}
                          />
                          <NotificationCategoryToggle
                            category="sync"
                            label="Sincronizzazione"
                            description="Stato della connessione e modifiche in coda"
                            icon={RefreshCw}
                          />
                          <NotificationCategoryToggle
                            category="goal"
                            label="Obiettivi finanziari"
                            description="Progresso verso il target economico annuale"
                            icon={Goal}
                          />
                          <NotificationCategoryToggle
                            category="quote"
                            label="Preventivi"
                            description="Stato dei preventivi (accettati, scaduti, rifiutati)"
                            icon={FileText}
                          />
                          <NotificationCategoryToggle
                            category="expense"
                            label="Spese elevate"
                            description="Notifiche per spese sopra la media"
                            icon={TrendingUp}
                          />
                          <NotificationCategoryToggle
                            category="system"
                            label="Sistema"
                            description="Aggiornamenti app e avvisi tecnici"
                            icon={Bell}
                          />
                        </div>
                      </div>
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wider">
                          Promemoria backup
                        </p>
                        <div>
                          <label className="block text-xs md:text-sm text-text-secondary mb-1">
                            Intervallo promemoria backup
                          </label>
                          <select
                            value={settings?.backup_reminder_interval_days ?? 7}
                            onChange={(e) => handleToggleSetting('backup_reminder_interval_days', Number(e.target.value))}
                            className="w-full rounded-input border border-border bg-surface px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            <option value={1}>Ogni giorno</option>
                            <option value={3}>Ogni 3 giorni</option>
                            <option value={7}>Ogni settimana</option>
                            <option value={14}>Ogni 2 settimane</option>
                            <option value={30}>Ogni mese</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
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
                <FileText className="h-4 md:h-5 w-4 md:w-5 text-brand/70" />
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
                  <AlertTriangle className="inline h-3 w-3 mr-1 text-pending" />
                  Il ripristino valida automaticamente lo schema del file JSON e forza l'user_id dell'utente corrente per prevenire accesso a dati altrui.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'sharing' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Condivisione con Commercialista</h3>
              </div>
              <p className="text-sm text-text-secondary">
                Crea link di sola lettura per condividere i tuoi dati con il commercialista.
                I link possono essere revocati in qualsiasi momento.
              </p>
              <SharesManager />
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'audit' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Registro Modifiche (Audit Log)</h3>
              </div>
              <p className="text-sm text-text-secondary">
                Cronologia delle modifiche a lavori, fatture, clienti e spese.
                I dati vengono conservati per la durata dell'account.
              </p>
              <AuditLogViewer />
            </GlassCard>
          </motion.div>
        </motion.div>
      )}


      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
