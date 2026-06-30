import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, CreditCard, AlertCircle, Plus, Trash2, Download, Globe, Copy, Check, RefreshCw } from 'lucide-react'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Toast } from '../../../shared/ui/Toast'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { QueryLoading } from '../../../shared/ui/QueryState'
import { useJobs } from '../../../lib/hooks/useJobs'
import { useInvoices } from '../../../lib/hooks/useInvoices'
import { useCustomEvents, useCreateCustomEvent, useDeleteCustomEvent } from '../../../lib/hooks/useCustomEvents'
import { useAuth } from '../../../app/providers/AuthProvider'
import { supabase } from '../../../lib/supabase'
import { downloadIcs } from '../../../lib/icsGenerator'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, format, addMonths, subMonths,
} from 'date-fns'
import { it } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  date: Date
  label: string
  type: 'deadline' | 'invoice' | 'pending' | 'custom'
  color?: string
  start_time?: string | null
  end_time?: string | null
  description?: string | null
  onDelete?: () => void
}

export function CalendarPage() {
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: invoices, isLoading: invLoading } = useInvoices()
  const { data: customEvents, isLoading: eventsLoading } = useCustomEvents()
  const createEvent = useCreateCustomEvent()
  const deleteEvent = useDeleteCustomEvent()
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventColor, setEventColor] = useState('#C5963A')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [calendarToken, setCalendarToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (user?.calendar_token) {
      setCalendarToken(user.calendar_token)
    }
  }, [user])

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
      result.push({
        id: ce.id,
        date: new Date(ce.date),
        label: ce.title,
        type: 'custom',
        color: ce.color,
        start_time: ce.start_time,
        end_time: ce.end_time,
        description: ce.description,
        onDelete: () => deleteEvent.mutate(ce.id),
      })
    })
    return result
  }, [jobs, invoices, customEvents, deleteEvent])

  const selectedEvents = events.filter((e) => selectedDate && isSameDay(e.date, selectedDate))

  const visibleEvents = useMemo(() => {
    return events.filter((e) => isSameMonth(e.date, currentDate))
  }, [events, currentDate])

  const icsUrl = useMemo(() => {
    if (!calendarToken) return null
    return `${window.location.origin}/ics/${calendarToken}`
  }, [calendarToken])

  const handleCopyLink = useCallback(async () => {
    if (!icsUrl) return
    try {
      await navigator.clipboard.writeText(icsUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = icsUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [icsUrl])

  const webcalUrl = useMemo(() => {
    if (!calendarToken) return null
    return `webcal://${window.location.host}/ics/${calendarToken}`
  }, [calendarToken])

  const subscribeUrls = useMemo(() => {
    if (!icsUrl || !webcalUrl) return null
    return {
      google: `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icsUrl)}`,
      apple: webcalUrl,
      outlook: `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addsubscription&name=NetFlow+Calendario&url=${encodeURIComponent(icsUrl)}`,
    }
  }, [icsUrl, webcalUrl])

  const handleRefreshToken = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('refresh_calendar_token')
      if (error) {
        setToast({ message: 'Errore durante la rigenerazione del token', type: 'error' })
        return
      }
      if (data) {
        setCalendarToken(data)
        setToast({ message: 'Nuovo token generato con successo', type: 'success' })
      }
    } catch {
      setToast({ message: 'Errore di connessione', type: 'error' })
    }
  }, [])

  async function handleAddEvent() {
    if (!eventTitle.trim() || !selectedDate) return
    await createEvent.mutateAsync({
      title: eventTitle.trim(),
      description: eventDescription || undefined,
      date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: eventStartTime || null,
      end_time: eventEndTime || null,
      color: eventColor,
    })
    setEventTitle('')
    setEventDescription('')
    setEventColor('#C5963A')
    setEventStartTime('')
    setEventEndTime('')
    setShowForm(false)
  }

  function handleExportMonthIcs() {
    const monthEvents = visibleEvents.map((e) => ({
      title: e.label,
      description: e.type === 'custom' ? e.description : undefined,
      date: format(e.date, 'yyyy-MM-dd'),
      start_time: e.type === 'custom' ? e.start_time : undefined,
      end_time: e.type === 'custom' ? e.end_time : undefined,
      color: e.type === 'custom' ? e.color : undefined,
    }))
    downloadIcs(monthEvents, `netflow-mese-${format(currentDate, 'yyyy-MM')}.ics`)
  }

  function formatTime(time: string): string {
    const [h, m] = time.split(':')
    return `${h}:${m}`
  }

  function renderTimeBadge(start_time?: string | null, end_time?: string | null) {
    if (!start_time) return null
    return (
      <span className="text-xs text-text-secondary font-mono tabular-nums">
        {formatTime(start_time)}{end_time ? ` - ${formatTime(end_time)}` : ''}
      </span>
    )
  }

  if (jobsLoading || invLoading || eventsLoading) return <QueryLoading />
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-4xl font-bold">Calendario</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" onClick={handleExportMonthIcs} className="text-xs md:text-sm">
            <Download className="mr-1 md:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Esporta mese</span>
            <span className="sm:hidden">ICS</span>
          </Button>
          <Button onClick={() => { setSelectedDate(new Date()); setShowForm(true) }} className="text-xs md:text-sm">
            <Plus className="mr-1 md:mr-2 h-4 w-4" />
            Nuovo evento
          </Button>
        </div>
      </div>

      {/* External calendar subscription card */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand/10 p-2.5">
              <Globe className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Collegamento calendario esterno</h3>
              <p className="text-xs text-text-secondary">Sottoscrivi questo calendario su Google, Apple o Outlook</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {icsUrl ? (
              <>
                <input
                  type="text"
                  readOnly
                  value={icsUrl}
                  className="w-40 md:w-64 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-secondary font-mono truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-full bg-brand/10 p-2 text-brand hover:bg-brand/20 transition-colors"
                  title="Copia link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleRefreshToken}
                  className="rounded-full bg-surface/60 p-2 text-text-secondary hover:text-text-primary transition-colors"
                  title="Genera nuovo token"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </>
            ) : (
              <p className="text-xs text-text-secondary">Caricamento...</p>
            )}
          </div>
        </div>
        {subscribeUrls && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-text-secondary mr-1">Aggiungi a:</span>
            <a
              href={subscribeUrls.google}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-surface/60 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface/80 transition-colors"
            >
              Google Calendar
            </a>
            <a
              href={subscribeUrls.apple}
              className="rounded-full bg-surface/60 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface/80 transition-colors"
            >
              Apple Calendar
            </a>
            <a
              href={subscribeUrls.outlook}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-surface/60 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface/80 transition-colors"
            >
              Outlook
            </a>
          </div>
        )}
      </GlassCard>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('month')}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
            viewMode === 'month' ? 'bg-brand text-white' : 'bg-surface/60 text-text-secondary hover:text-text-primary'
          }`}
        >
          Mese
        </button>
        <button
          onClick={() => setViewMode('agenda')}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
            viewMode === 'agenda' ? 'bg-brand text-white' : 'bg-surface/60 text-text-secondary hover:text-text-primary'
          }`}
        >
          Agenda
        </button>
      </div>

      {viewMode === 'month' ? (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-5 w-5 text-text-secondary hover:text-text-primary" />
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
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
                    selectedDate && isSameDay(day, selectedDate) ? 'bg-brand/20' : 'hover:bg-surface/80'
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
                          e.type === 'deadline' ? 'bg-expense' : e.type === 'pending' ? 'bg-pending/60' : e.type === 'invoice' ? 'bg-success/60' : ''
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
      ) : (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Agenda — {format(currentDate, 'MMMM yyyy', { locale: it })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-full p-1.5 hover:bg-surface/80 transition-colors">
                <ChevronLeft className="h-4 w-4 text-text-secondary" />
              </button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-full p-1.5 hover:bg-surface/80 transition-colors">
                <ChevronRight className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {visibleEvents.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">Nessun evento in questo mese</p>
            ) : (
              visibleEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3">
                  {e.type === 'deadline' ? <AlertCircle className="h-4 w-4 text-expense" /> :
                   e.type === 'pending' ? <CreditCard className="h-4 w-4 text-pending" /> :
                   e.type === 'invoice' ? <CalendarDays className="h-4 w-4 text-success" /> :
                   <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: e.color }} />}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm block truncate">{e.label}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-secondary">{format(e.date, 'd MMM', { locale: it })}</span>
                      {renderTimeBadge(e.start_time, e.end_time)}
                    </div>
                  </div>
                  <Badge variant={e.type === 'deadline' ? 'danger' : e.type === 'pending' ? 'warning' : e.type === 'invoice' ? 'success' : 'info'}>
                    {e.type === 'deadline' ? 'Scadenza' : e.type === 'pending' ? 'Da incassare' : e.type === 'invoice' ? 'Incassato' : 'Evento'}
                  </Badge>
                  {e.type === 'custom' && e.onDelete && (
                    <button onClick={e.onDelete} className="text-text-secondary hover:text-expense transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}

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
                  <div key={e.id} className="flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3">
                    {e.type === 'deadline' ? <AlertCircle className="h-4 w-4 text-expense" /> :
                     e.type === 'pending' ? <CreditCard className="h-4 w-4 text-pending" /> :
                     e.type === 'invoice' ? <CalendarDays className="h-4 w-4 text-success" /> :
                     <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: e.color }} />}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm block truncate">{e.label}</span>
                      {e.type === 'custom' && e.description && (
                        <p className="text-xs text-text-secondary mt-0.5 truncate">{e.description}</p>
                      )}
                      {renderTimeBadge(e.start_time, e.end_time)}
                    </div>
                    <Badge variant={e.type === 'deadline' ? 'danger' : e.type === 'pending' ? 'warning' : e.type === 'invoice' ? 'success' : 'info'}>
                      {e.type === 'deadline' ? 'Scadenza' : e.type === 'pending' ? 'Da incassare' : e.type === 'invoice' ? 'Incassato' : 'Evento'}
                    </Badge>
                    {e.type === 'custom' && e.onDelete && (
                      <button onClick={e.onDelete} className="text-text-secondary hover:text-expense transition-colors shrink-0">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Ora inizio (opzionale)</label>
              <input
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Ora fine (opzionale)</label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Colore</label>
            <div className="flex gap-2 flex-wrap">
              {['#C5963A', '#00D2FF', '#00B894', '#FDCB6E', '#FF6B6B', '#FF9FF3', '#54A0FF', '#5F27CD'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEventColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${eventColor === c ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''}`}
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
