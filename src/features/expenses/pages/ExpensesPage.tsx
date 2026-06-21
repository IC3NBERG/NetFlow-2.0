import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Input } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { FormSection } from '../../../shared/ui/FormSection'
import { formatCurrency } from '../../../lib/calculations'
import { useExpenses } from '../../../lib/hooks/useExpenses'
import { isOfflineQueued, isOfflineSyncDisabled } from '../../../lib/syncExecute'
import { Toast } from '../../../shared/ui/Toast'
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

  function resetForm() {
    setTitle('')
    setAmount('')
    setCategory('Altro')
    setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
    setEditingId(null)
    setIsFormOpen(false)
  }

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

  return (
    <div className="space-y-4">
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

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <p className="text-text-secondary">Caricamento spese...</p>
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState 
          title="Nessuna spesa" 
          description="Tutto in ordine! Non hai ancora registrato nessuna uscita. Clicca su Nuova spesa per iniziare."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard className="p-3 md:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm md:text-base truncate">{expense.title}</h4>
                      {expense.description && (
                        <p className="text-[10px] md:text-xs text-text-secondary mt-0.5 truncate">{expense.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button onClick={() => openEdit(expense)} className="rounded-full p-1.5 text-text-secondary hover:bg-surface/80 hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0">
                        <Pencil className="h-3 md:h-3.5 w-3 md:w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="rounded-full p-1.5 text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0">
                        <Trash2 className="h-3 md:h-3.5 w-3 md:w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm md:text-lg font-bold font-mono tabular-nums text-expense">{formatCurrency(expense.amount)}</span>
                    {expense.category && (
                      <span className="rounded-full bg-surface/60 px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] text-text-secondary shrink-0">{expense.category}</span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] md:text-[10px] text-text-secondary">{expense.date}</p>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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

            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormSection>

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
