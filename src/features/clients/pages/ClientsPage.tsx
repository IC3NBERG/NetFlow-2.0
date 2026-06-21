import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { Toast } from '../../../shared/ui/Toast'
import { FormSection } from '../../../shared/ui/FormSection'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../../../lib/hooks/useClients'
import { isOfflineQueued } from '../../../lib/syncBridge'
import { Plus, Pencil, Trash2, Check, Mail, Phone, Building2, CreditCard } from 'lucide-react'

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
  const [color, setColor] = useState('#6C5CE7')

  function resetForm() {
    setName('')
    setEmail('')
    setPhone('')
    setVatNumber('')
    setFiscalCode('')
    setAddress('')
    setNotes('')
    setColor('#6C5CE7')
    setEditingId(null)
    setIsFormOpen(false)
  }

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
    setColor(client.color ?? '#6C5CE7')
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
        setToast({ message: 'Errore durante il salvataggio', type: 'error' })
      }
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
              {['#6C5CE7', '#00D2FF', '#00B894', '#FF6B6B', '#F59E0B', '#FD79A8', '#A29BFE', '#636E72'].map((c) => (
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
            <motion.div key={client.id} variants={itemAnim}>
              <GlassCard className="p-4 md:p-5 space-y-3 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div
                      className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs md:text-sm text-white"
                      style={{ backgroundColor: client.color ?? '#6C5CE7' }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate">{client.name}</p>
                      {client.email && (
                        <p className="text-[10px] md:text-xs text-text-secondary flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="h-2.5 md:h-3 w-2.5 md:w-3 shrink-0" />
                          {client.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(client)} className="rounded-full p-1.5 text-text-secondary hover:bg-white/5 hover:text-brand min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0">
                      <Pencil className="h-3.5 md:h-4 w-3.5 md:w-4" />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="rounded-full p-1.5 text-text-secondary hover:bg-white/5 hover:text-expense min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0">
                      <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-[10px] md:text-xs text-text-secondary">
                  {client.phone && <p className="flex items-center gap-1 truncate"><Phone className="h-2.5 md:h-3 w-2.5 md:w-3 shrink-0" />{client.phone}</p>}
                  {client.vat_number && <p className="flex items-center gap-1 truncate"><Building2 className="h-2.5 md:h-3 w-2.5 md:w-3 shrink-0" />IVA: {client.vat_number}</p>}
                  {client.fiscal_code && <p className="flex items-center gap-1 truncate"><CreditCard className="h-2.5 md:h-3 w-2.5 md:w-3 shrink-0" />CF: {client.fiscal_code}</p>}
                  {client.address && <p className="truncate">{client.address}</p>}
                </div>
                {client.notes && (
                  <p className="text-[10px] md:text-xs text-text-secondary italic border-t border-border/50 pt-2 truncate">{client.notes}</p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal open={isFormOpen} onClose={resetForm} title={editingId ? 'Modifica cliente' : 'Nuovo cliente'}>
        {formFields}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
