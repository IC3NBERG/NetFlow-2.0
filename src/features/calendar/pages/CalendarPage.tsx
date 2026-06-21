import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, CreditCard, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { QueryLoading } from '../../../shared/ui/QueryState'
import { useJobs } from '../../../lib/hooks/useJobs'
import { useInvoices } from '../../../lib/hooks/useInvoices'
import { useCustomEvents, useCreateCustomEvent, useDeleteCustomEvent } from '../../../lib/hooks/useCustomEvents'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, format,
} from 'date-fns'
import { it } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  date: Date
  label: string
  type: 'deadline' | 'invoice' | 'pending' | 'custom'
  color?: string
  onDelete?: () => void
}

export function CalendarPage() {
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: invoices, isLoading: invLoading } = useInvoices()
  const { data: customEvents, isLoading: eventsLoading } = useCustomEvents()
  const createEvent = useCreateCustomEvent()
  const deleteEvent = useDeleteCustomEvent()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventColor, setEventColor] = useState('#6C5CE7')

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = []
    jobs?.forEach((job) => {
      if (job.pending_date) {
        result.push({ id: `p-${job.id}`, date: new Date(job.pending_date), label: `Da incassare: ${job.title}`, type: 'pending' })
      }
      if (job.end_date) {
        result.push({ id: `e-${job.id}`, date: new Date(job.end_date), label: `Incassato: ${job.title}`, type: 'invoice' })
      }
    })
    invoices?.forEach((inv) => {
      if (inv.due_date) {
        result.push({ id: `i-${inv.id}`, date: new Date(inv.due_date), label: `Scadenza fattura ${inv.invoice_number}`, type: 'deadline' })
      }
    })
    customEvents?.forEach((ce) => {
      result.push({ id: ce.id, date: new Date(ce.date), label: ce.title, type: 'custom', color: ce.color, onDelete: () => deleteEvent.mutate(ce.id) })
    })
    return result
  }, [jobs, invoices, customEvents, deleteEvent])

  const selectedEvents = events.filter((e) => selectedDate && isSameDay(e.date, selectedDate))

  async function handleAddEvent() {
    if (!eventTitle.trim() || !selectedDate) return
    await createEvent.mutateAsync({
      title: eventTitle.trim(),
      description: eventDescription || undefined,
      date: format(selectedDate, 'yyyy-MM-dd'),
      color: eventColor,
    })
    setEventTitle('')
    setEventDescription('')
    setEventColor('#6C5CE7')
    setShowForm(false)
  }

  if (jobsLoading || invLoading || eventsLoading) return <QueryLoading />
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Calendario</h1>
        <Button onClick={() => { setSelectedDate(new Date()); setShowForm(true) }} className="text-xs md:text-sm">
          <Plus className="mr-1 md:mr-2 h-4 w-4" />
          Nuovo evento
        </Button>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
            <ChevronLeft className="h-5 w-5 text-text-secondary hover:text-text-primary" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
            <ChevronRight className="h-5 w-5 text-text-secondary hover:text-text-primary" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-text-secondary py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.date, day))
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative min-h-[72px] rounded-xl p-1.5 text-left transition-all ${
                  !isSameMonth(day, currentDate) ? 'opacity-30' : ''
                } ${isToday(day) ? 'ring-1 ring-brand' : ''} ${
                  selectedDate && isSameDay(day, selectedDate) ? 'bg-brand/20' : 'hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-medium ${isToday(day) ? 'text-brand' : 'text-text-secondary'}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex flex-col gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={`h-1.5 w-full rounded-full ${
                        e.type === 'deadline' ? 'bg-expense' : e.type === 'pending' ? 'bg-[#FDCB6E]' : e.type === 'invoice' ? 'bg-[#00B894]' : ''
                      }`}
                      style={e.type === 'custom' ? { backgroundColor: e.color, height: '6px', borderRadius: '999px' } : {}}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-text-secondary">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </GlassCard>

      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">
                {format(selectedDate, 'EEEE d MMMM', { locale: it })}
              </h3>
              <button
                onClick={() => { setShowForm(true) }}
                className="rounded-full bg-brand p-2 text-white hover:bg-brand/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-text-secondary">Nessun evento per questo giorno</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                    {e.type === 'deadline' ? <AlertCircle className="h-4 w-4 text-expense" /> :
                     e.type === 'pending' ? <CreditCard className="h-4 w-4 text-[#FDCB6E]" /> :
                     e.type === 'invoice' ? <CalendarDays className="h-4 w-4 text-[#00B894]" /> :
                     <div className="h-4 w-4 rounded-full" style={{ backgroundColor: e.color }} />}
                    <span className="text-sm flex-1">{e.label}</span>
                    <Badge variant={e.type === 'deadline' ? 'danger' : e.type === 'pending' ? 'warning' : e.type === 'invoice' ? 'success' : 'info'}>
                      {e.type === 'deadline' ? 'Scadenza' : e.type === 'pending' ? 'Da incassare' : e.type === 'invoice' ? 'Incassato' : 'Evento'}
                    </Badge>
                    {e.type === 'custom' && e.onDelete && (
                      <button onClick={e.onDelete} className="text-text-secondary hover:text-expense transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuovo evento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Titolo *</label>
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Es. Riunione con cliente"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Descrizione (opzionale)</label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={2}
              placeholder="Note..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Data</label>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Colore</label>
            <div className="flex gap-2">
              {['#6C5CE7', '#00D2FF', '#00B894', '#FDCB6E', '#FF6B6B', '#FF9FF3', '#54A0FF', '#5F27CD'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEventColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${eventColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1 rounded-full">Annulla</Button>
            <Button onClick={handleAddEvent} disabled={!eventTitle.trim()} className="flex-1 rounded-full">
              Aggiungi evento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
