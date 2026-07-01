import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Tag, Calendar } from 'lucide-react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { FormSection } from '../../../shared/ui/FormSection'
import { formatCurrency } from '../../../lib/calculations'
import { cn, formatDate } from '../../../lib/utils'
import { useExpenses } from '../../../lib/hooks/useExpenses'
import { isOfflineQueued, isOfflineSyncDisabled } from '../../../lib/syncExecute'
import { Toast } from '../../../shared/ui/Toast'
import { AttachmentsField } from '../../../shared/ui/AttachmentsField'
import { CurrencySelect } from '../../../shared/ui/CurrencySelect'
import type { Expense } from '../../../types/database'

type ToastState = { message: string; type: 'success' | 'error' | 'info' } | null

const EXPENSE_CATEGORIES = [
  'Affitto',
  'Utenze',
  'Software',
  'Trasporti',
  'Pubblicita',
  'Consulenze',
  'Materiali',
  'Altro',
]

const filters = [
  { id: 'all' as const, label: 'Tutte' },
  ...EXPENSE_CATEGORIES.map((c) => ({ id: c, label: c })),
]

export function ExpensesPage() {
  const { data: expenses = [], isLoading, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [toast, setToast] = useState<ToastState>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Altro')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [expenseCurrency, setExpenseCurrency] = useState('EUR')
  const [activeFilter, setActiveFilter] = useState('all')

  function resetForm() {
    setTitle('')
    setAmount('')
    setCategory('Altro')
    setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
    setAttachmentUrls([])
    setExpenseCurrency('EUR')
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

  function openEdit(expense: Expense) {
    setTitle(expense.title)
    setAmount(String(expense.amount))
    setCategory(expense.category ?? 'Altro')
    setDescription(expense.description ?? '')
    setDate(expense.date)
    setExpenseCurrency(expense.currency ?? 'EUR')
    setAttachmentUrls(expense.attachment_urls ?? [])
    setEditingId(expense.id)
    setIsFormOpen(true)
  }

  async function handleSave() {
    const numAmount = parseFloat(amount)
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return

    const payload = {
      title: title.trim(),
      amount: numAmount,
      category,
      description: description || null,
      date,
      currency: expenseCurrency,
      attachment_urls: attachmentUrls,
    }

    try {
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, ...payload })
        setToast({ message: 'Spesa aggiornata', type: 'success' })
      } else {
        await createExpense.mutateAsync(payload)
        setToast({ message: 'Spesa creata', type: 'success' })
      }
      resetForm()
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Salvato offline — verrà sincronizzato al ritorno della connessione', type: 'info' })
        resetForm()
      } else if (isOfflineSyncDisabled(err)) {
        setToast({ message: 'Sei offline e la sincronizzazione è disattivata nelle impostazioni', type: 'error' })
      } else {
        setToast({ message: 'Errore durante il salvataggio', type: 'error' })
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id)
      setToast({ message: 'Spesa eliminata', type: 'success' })
    } catch (err) {
      if (isOfflineQueued(err)) {
        setToast({ message: 'Eliminazione in coda — sincronizzazione al ritorno online', type: 'info' })
      } else if (isOfflineSyncDisabled(err)) {
        setToast({ message: 'Sei offline e la sincronizzazione è disattivata nelle impostazioni', type: 'error' })
      } else {
        setToast({ message: 'Errore durante l\'eliminazione', type: 'error' })
      }
    }
  }

  const totalExpenses = expenses.reduce((t, e) => t + e.amount, 0)

  const filteredExpenses = expenses.filter((e) => {
    if (activeFilter !== 'all' && (e.category ?? 'Altro') !== activeFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Uscite</h2>
          <p className="text-xs md:text-sm text-text-secondary">Gestisci tutte le tue spese</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1 md:gap-2 rounded-full bg-brand px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white hover:bg-brand/90 transition-colors">
          <Plus className="h-3.5 md:h-4 w-3.5 md:w-4" />
          <span className="hidden sm:inline">Nuova spesa</span>
          <span className="sm:hidden">Nuova</span>
        </button>
      </div>

      <GlassCard className="p-3 md:p-4 flex items-center gap-2">
        <span className="text-xs md:text-sm text-text-secondary">Totale spese:</span>
        <span className="text-base md:text-xl font-bold font-mono tabular-nums text-expense">{formatCurrency(totalExpenses)}</span>
      </GlassCard>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all border shrink-0',
              activeFilter === filter.id
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border bg-surface text-text-secondary hover:border-brand/50 hover:text-text-primary',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-text-secondary">Caricamento spese...</p>
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState 
          title="Nessuna spesa" 
          description="Tutto in ordine! Non hai ancora registrato nessuna uscita. Clicca su Nuova spesa per iniziare."
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title="Nessuna spesa trovata"
          description="Nessuna spesa corrisponde alla categoria selezionata."
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredExpenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <GlassCard className="p-4 md:p-5 flex flex-col justify-between h-full space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-full bg-expense/15 text-expense px-2.5 py-0.5 text-[10px] md:text-xs font-semibold tracking-wide uppercase">
                            {expense.category || 'Altro'}
                          </span>
                        </div>
                        <h4 className="font-bold text-base md:text-lg mt-1.5 line-clamp-1">{expense.title}</h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(expense)} className="rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-text-primary transition-colors h-8 w-8 flex items-center justify-center">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="rounded-full p-1.5 text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors h-8 w-8 flex items-center justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 min-h-[2rem]">
                      {expense.description || <span className="italic opacity-60">Nessuna descrizione</span>}
                    </p>
                  </div>

                  {/* Financial & Date Info */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-border/50 py-3 my-1">
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Importo</p>
                      <p className="text-lg md:text-xl font-bold font-mono tabular-nums tracking-tight mt-0.5 text-expense">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <div className="text-right self-center">
                      <div className="flex items-center justify-end gap-1.5 text-[11px] text-text-secondary">
                        <Calendar className="h-3 w-3 opacity-70" />
                        <span className="font-medium text-text-primary">{formatDate(expense.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2 min-h-[1.5rem]">
                    <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                      <Tag className="h-3 w-3 opacity-70" />
                      <span>{expense.category || 'Altro'}</span>
                    </div>
                    {expense.currency && expense.currency !== 'EUR' && (
                      <span className="text-[10px] font-mono text-text-secondary bg-surface/60 px-2 py-0.5 rounded-full">
                        {expense.currency}
                      </span>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <Modal open={isFormOpen} onClose={resetForm} title={editingId ? 'Modifica spesa' : 'Nuova spesa'}>
        <div className="w-full">
          <FormSection title="Dettagli Principali">
            <Input
              label="Titolo"
              placeholder="Es. Affitto ufficio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Input
              label="Importo"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormSection>

          <FormSection title="Categoria e Data">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand transition-colors"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Input
              label="Descrizione"
              placeholder="Note opzionali"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <label className="block text-sm text-text-secondary mb-1">Valuta</label>
              <CurrencySelect value={expenseCurrency} onChange={setExpenseCurrency} />
            </div>

            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormSection>

          <div className="px-6 pb-4">
            <AttachmentsField urls={attachmentUrls} onChange={setAttachmentUrls} />
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={resetForm} className="flex-1 rounded-full bg-surface py-2.5 text-sm font-medium text-text-secondary hover:bg-surface/80 transition-colors">
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {editingId ? 'Salva' : 'Crea'}
            </button>
          </div>
        </div>
      </Modal>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

