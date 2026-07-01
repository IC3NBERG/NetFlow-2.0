import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Briefcase, Users, FileText, Receipt, ArrowRight, Loader2, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../app/providers/AuthProvider'
import { cn } from '../../lib/utils'

interface SearchResult {
  id: string
  label: string
  description: string
  type: 'job' | 'client' | 'invoice' | 'expense' | 'quote'
  route: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !user) {
      setResults([])
      return
    }
    setLoading(true)
    const term = `%${q}%`
    try {
      const [jobsRes, clientsRes, invoicesRes, expensesRes, quotesRes] = await Promise.all([
        supabase.from('jobs').select('id, title, clients(name)').eq('user_id', user.id).ilike('title', term).limit(5),
        supabase.from('clients').select('id, name, vat_number').eq('user_id', user.id).ilike('name', term).limit(5),
        supabase.from('invoices').select('id, invoice_number, type, gross_amount').eq('user_id', user.id).ilike('invoice_number', term).limit(5),
        supabase.from('expenses').select('id, title, amount, category').eq('user_id', user.id).ilike('title', term).limit(5),
        supabase.from('quotes').select('id, title, quote_number, clients(name)').eq('user_id', user.id).ilike('title', term).limit(5),
      ])

      const r: SearchResult[] = []
      
      // Jobs
      jobsRes.data?.forEach((j: any) => {
        const clientName = j.clients?.name ? ` • ${j.clients.name}` : ''
        r.push({ id: j.id, label: j.title, description: `Lavoro${clientName}`, type: 'job' as const, route: '/jobs' })
      })

      // Clients
      clientsRes.data?.forEach((c: any) => {
        const vat = c.vat_number ? ` • P.IVA: ${c.vat_number}` : ''
        r.push({ id: c.id, label: c.name, description: `Cliente${vat}`, type: 'client' as const, route: '/clients' })
      })

      // Invoices
      invoicesRes.data?.forEach((inv: any) => {
        const typeStr = inv.type === 'parcella' ? 'Parcella' : 'Fattura'
        const amountStr = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(inv.gross_amount)
        r.push({ id: inv.id, label: `${inv.invoice_number}`, description: `${typeStr} • Lordo: ${amountStr}`, type: 'invoice' as const, route: '/invoicing' })
      })

      // Expenses
      expensesRes.data?.forEach((e: any) => {
        const amountStr = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(e.amount)
        const catStr = e.category ? ` • ${e.category}` : ''
        r.push({ id: e.id, label: e.title, description: `Spesa • ${amountStr}${catStr}`, type: 'expense' as const, route: '/expenses' })
      })

      // Quotes (Preventivi)
      quotesRes.data?.forEach((q: any) => {
        const clientName = q.clients?.name ? ` • ${q.clients.name}` : ''
        r.push({ id: q.id, label: `${q.quote_number} - ${q.title}`, description: `Preventivo${clientName}`, type: 'quote' as const, route: '/quotes' })
      })

      setResults(r)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const debounce = setTimeout(() => search(query), 200)
    return () => clearTimeout(debounce)
  }, [query, search])

  function handleSelect(result: SearchResult) {
    setOpen(false)
    navigate(result.route)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    }
  }

  const iconMap = { job: Briefcase, client: Users, invoice: FileText, expense: Receipt, quote: FileSpreadsheet } as const

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-surface/90 backdrop-blur-3xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Cerca lavori, clienti, fatture, spese..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-text-secondary"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] text-text-secondary">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">Nessun risultato per "{query}"</p>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-0.5">
              {results.map((result, i) => {
                const Icon = iconMap[result.type]
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                      i === selectedIndex ? 'bg-brand/20 text-text-primary' : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.label}</p>
                      <p className="text-xs text-text-secondary">{result.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                )
              })}
            </div>
          )}
          {!query && !loading && (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Azioni Suggerite
              </div>
              <div className="space-y-0.5">
                {[
                  { label: 'Vai alla Dashboard', route: '/dashboard', desc: 'Panoramica economica', type: 'job' as const, icon: iconMap.job },
                  { label: 'Nuovo Lavoro', route: '/jobs?action=new', desc: 'Avvia una nuova prestazione', type: 'job' as const, icon: iconMap.job },
                  { label: 'Nuovo Preventivo', route: '/quotes?action=new', desc: 'Crea una bozza preventivo', type: 'quote' as const, icon: iconMap.quote },
                  { label: 'Nuova Spesa (Uscita)', route: '/expenses?action=new', desc: 'Registra un pagamento/acquisto', type: 'expense' as const, icon: iconMap.expense },
                  { label: 'Aggiungi Cliente', route: '/clients?action=new', desc: 'Registra un nuovo contatto', type: 'client' as const, icon: iconMap.client },
                ].map((act, i) => (
                  <button
                    key={act.route}
                    onClick={() => {
                      setOpen(false)
                      // If the route has an action query parameter, we can handle it or let the target page handle it
                      navigate(act.route)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                      i === selectedIndex ? 'bg-brand/20 text-text-primary' : 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
                    )}
                  >
                    <act.icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{act.label}</p>
                      <p className="text-xs text-text-secondary">{act.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
