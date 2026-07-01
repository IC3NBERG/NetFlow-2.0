import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Toast } from '../../../shared/ui/Toast'
import { useAuth } from '../../../app/providers/AuthProvider'
import { useUpdateProfile } from '../../../lib/hooks/useProfile'
import { User, FileText, Save, Upload } from 'lucide-react'
import type { GoalData } from '../../../types/database'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

export function AccountPage() {
  const { user, refreshProfile } = useAuth()
  const updateProfile = useUpdateProfile()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [fiscalCode, setFiscalCode] = useState('')
  const [address, setAddress] = useState('')
  const [invoiceFooter, setInvoiceFooter] = useState('')
  const [iban, setIban] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '')
      setBusinessName(user.business_name ?? '')
      setVatNumber(user.vat_number ?? '')
      setFiscalCode(user.fiscal_code ?? '')
      setAddress(user.address ?? '')
      const gd = user.goal_data && typeof user.goal_data === 'object' ? user.goal_data as GoalData : null
      setInvoiceFooter(gd?.invoice_footer ?? '')
      setIban(gd?.iban ?? '')
    }
  }, [user])

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
      })
      await refreshProfile()
      setToast({ message: 'Profilo aggiornato con successo', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante il salvataggio', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveTemplate() {
    if (!user) return
    setIsSubmitting(true)
    try {
      const currentGoalData = user.goal_data && typeof user.goal_data === 'object' ? user.goal_data as GoalData : { target: 0, metric: 'net_settled' as const, segments: [] }
      await updateProfile.mutateAsync({
        id: user.id,
        goal_data: { ...currentGoalData, invoice_footer: invoiceFooter || undefined, iban: iban || undefined },
      })
      await refreshProfile()
      setToast({ message: 'Template aggiornato', type: 'success' })
    } catch {
      setToast({ message: 'Errore durante il salvataggio', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">Account</h2>
        <p className="text-xs md:text-sm text-text-secondary">Il tuo profilo e le tue notifiche</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 md:h-5 w-4 md:w-5 text-brand" />
              <h3 className="text-base md:text-lg font-semibold">Profilo</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Nome completo"
                  placeholder="Mario Rossi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <Input
                label="Ragione sociale"
                placeholder="Azienda SRL"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label="Partita IVA"
                placeholder="01234567890"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
              />
              <Input
                label="Codice Fiscale"
                placeholder="RSSMRA80A01H501U"
                value={fiscalCode}
                onChange={(e) => setFiscalCode(e.target.value)}
              />
              <Input
                label="Indirizzo"
                placeholder="Via Roma 1, Milano"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
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
          <GlassCard className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 md:h-5 w-4 md:w-5 text-[#00D2FF]" />
              <h3 className="text-base md:text-lg font-semibold">Personalizzazione Fatture</h3>
            </div>
            <p className="text-xs md:text-sm text-text-secondary">
              Configura il template delle tue parcelle e fatture
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="IBAN"
                placeholder="IT00X0000000000000000000000"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
              />
              <Input
                label="Piè di pagina"
                placeholder="Grazie per la collaborazione"
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button variant="secondary" onClick={() => {}} className="text-xs md:text-sm">
                <Upload className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
                Carica logo
              </Button>
              <Button onClick={handleSaveTemplate} disabled={isSubmitting} className="text-xs md:text-sm">
                <Save className="mr-1 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
                Salva template
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
