import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { Toast } from '../../../shared/ui/Toast'
import { FormSection } from '../../../shared/ui/FormSection'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../../../lib/hooks/useClients'
import { useCreateShare } from '../../../lib/hooks/useShares'
import { isOfflineQueued } from '../../../lib/syncBridge'
import { Plus, Pencil, Trash2, Check, Mail, Phone, Building2, CreditCard, Info, ExternalLink, Loader2 } from 'lucide-react'
import { ClientHistoryModal } from '../components/ClientHistoryModal'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

export function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const [toast, setToast] = useState<ToastState>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [fiscalCode, setFiscalCode] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#C5963A')
  const [historyClientId, setHistoryClientId] = useState<string | null>(null)
  const [portalLoadingId, setPortalLoadingId] = useState<string | null>(null)
  const createShare = useCreateShare()

  function resetForm() {
    setName('')
    setEmail('')
    setPhone('')
    setVatNumber('')
    setFiscalCode('')
    setAddress('')
    setNotes('')
    setColor('#C5963A')
    setEditingId(null)
    setIsFormOpen(false)
  }

  // Handle suggested action query param
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    if (queryParams.get('action') === 'new') {
      window.history.replaceState({}, document.title, window.location.pathname)
      openCreate()
    }
  }, [])

  function openCreate() {
    resetForm()
    setIsFormOpen(true)
  }

  function openEdit(client: typeof clients[number]) {
    setName(client.name)
    setEmail(client.email ?? '')
    setPhone(client.phone ?? '')
    setVatNumber(client.vat_number ?? '')
    setFiscalCode(client.fiscal_code ?? '')
    setAddress(client.address ?? '')
    setNotes(client.notes ?? '')
    setColor(client.color ?? '#C5963A')
    setEditingId(client.id)
    setIsFormOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    try {
      if (editingId) {
        await updateClient.mutateAsync({
          id: editingId,
          name: name.trim(),
          email: email || null,
          phone: phone || null,
          vat_number: vatNumber || null,
          fiscal_code: fiscalCode || null,
          address: address || null,
          notes: notes || null,
          color: color,
        })
        setToast({ message: 'Cliente aggiornato', type: 'success' })
      } else {
        await createClient.mutateAsync({
          name: name.trim(),
          email: email || null,
          phone: phone || null,
          vat_number: vatNumber || null,
          fiscal_code: fiscalCode || null,
          address: address || null,
          notes: notes || null,
          color: color,
        })
        setToast({ message: 'Cliente creato', type: 'success' })
      }
      resetForm()
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Salvato offline — verrà sincronizzato al ritorno della connessione', type: 'info' })
        resetForm()
      } else {
        const msg = err instanceof Error ? err.message : 'Errore durante il salvataggio'
        console.error('[ClientsPage] Save error:', err)
        setToast({ message: msg, type: 'error' })
      }
    }
  }

  async function handleCreatePortal(clientId: string, clientName: string) {
    setPortalLoadingId(clientId)
    try {
      const share = await createShare.mutateAsync({
        access_level: 'view',
        name: `Portale ${clientName}`,
        client_id: clientId,
        expires_at: new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year
      })
      const url = `${window.location.origin}/client-portal/${(share as any).token}`
      await navigator.clipboard.writeText(url)
      setToast({ message: `Portale creato! Link copiato: ${clientName}`, type: 'success' })
    } catch {
      setToast({ message: 'Errore nella creazione del portale', type: 'error' })
    } finally {
      setPortalLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Eliminare questo cliente? I lavori collegati non verranno cancellati.')) return
    try {
      await deleteClient.mutateAsync(id)
      setToast({ message: 'Cliente eliminato', type: 'success' })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Eliminazione in coda — sincronizzazione al ritorno online', type: 'info' })
      } else {
        setToast({ message: 'Errore durante l\'eliminazione', type: 'error' })
      }
    }
  }

  const formFields = (
    <div className="space-y-4 w-full">
      <FormSection title="Dati Personali">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Nome *" placeholder="Mario Rossi" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Input label="Email" placeholder="mario@esempio.it" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Telefono" placeholder="+39 123 456 7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Dati Fiscali e Indirizzo">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Partita IVA" placeholder="01234567890" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
          <Input label="Codice Fiscale" placeholder="RSSMRA80A01H501U" value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} />
          <div className="md:col-span-2">
            <Input label="Indirizzo" placeholder="Via Roma 1, Milano" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Personalizzazione e Note">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Colore</label>
            <div className="flex flex-wrap gap-2">
              {['#C5963A', '#00D2FF', '#00B894', '#FF6B6B', '#F59E0B', '#FD79A8', '#A29BFE', '#636E72'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note opzionali..."
              className="w-full rounded-input border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand transition-all min-h-[80px] resize-y"
            />
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={resetForm}>Annulla</Button>
        <Button onClick={handleSave} disabled={!name.trim() || createClient.isPending || updateClient.isPending}>
          <Check className="mr-2 h-4 w-4" />
          {editingId ? 'Salva modifiche' : 'Crea cliente'}
        </Button>
      </div>
    </div>
  )

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-text-secondary text-lg">Caricamento clienti...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Clienti</h2>
          <p className="text-xs md:text-sm text-text-secondary">Gestisci la tua rubrica clienti</p>
        </div>
        {!isFormOpen && (
          <Button onClick={openCreate} className="text-xs md:text-sm px-3 md:px-4">
            <Plus className="mr-1 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nuovo cliente</span>
            <span className="sm:hidden">Nuovo</span>
          </Button>
        )}
      </div>

      {clients.length === 0 && !isFormOpen ? (
        <EmptyState
          title="Nessun cliente"
          description="Crea il tuo primo cliente per iniziare"
        />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <motion.div key={client.id} variants={itemAnim} className="h-full">
              <GlassCard className="p-4 md:p-5 flex flex-col justify-between h-full space-y-4 group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs md:text-sm text-white"
                        style={{ backgroundColor: client.color ?? '#C5963A' }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm md:text-base truncate">{client.name}</p>
                        <p className="text-[10px] md:text-xs text-text-secondary flex items-center gap-1 mt-0.5 truncate min-h-[1.25rem]">
                          <Mail className="h-2.5 md:h-3 w-2.5 md:w-3 shrink-0" />
                          {client.email || <span className="opacity-50">Nessuna email</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setHistoryClientId(client.id)}
                        className="rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-brand min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"
                        aria-label="Storico cliente"
                      >
                        <Info className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      </button>
                      <button
                        onClick={() => handleCreatePortal(client.id, client.name)}
                        className="rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-brand min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"
                        aria-label="Crea portale cliente"
                        title="Crea portale cliente e copia link"
                        disabled={portalLoadingId === client.id}
                      >
                        {portalLoadingId === client.id
                          ? <Loader2 className="h-3.5 md:h-4 w-3.5 md:w-4 animate-spin" />
                          : <ExternalLink className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        }
                      </button>
                      <button onClick={() => openEdit(client)} className="rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-brand min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0">
                        <Pencil className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-expense min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0">
                        <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10px] md:text-xs text-text-secondary border-t border-border/40 pt-3">
                    <p className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="opacity-75">Tel:</span>
                      <span className="font-medium text-text-primary">{client.phone || '—'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="opacity-75">P.IVA:</span>
                      <span className="font-medium text-text-primary">{client.vat_number || '—'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <CreditCard className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="opacity-75">C.F.:</span>
                      <span className="font-medium text-text-primary">{client.fiscal_code || '—'}</span>
                    </p>
                    <p className="truncate text-text-secondary/90 min-h-[1.25rem]">
                      Indirizzo: <span className="text-text-primary font-medium">{client.address || '—'}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-2 min-h-[2.5rem] flex items-center">
                  <p className="text-[10px] md:text-xs text-text-secondary italic truncate w-full">
                    {client.notes ? `Note: ${client.notes}` : <span className="opacity-50">Nessuna nota aggiuntiva</span>}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal open={isFormOpen} onClose={resetForm} title={editingId ? 'Modifica cliente' : 'Nuovo cliente'}>
        {formFields}
      </Modal>

      {historyClientId && (
        <ClientHistoryModal
          client={clients.find((c) => c.id === historyClientId)!}
          open={!!historyClientId}
          onClose={() => setHistoryClientId(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
