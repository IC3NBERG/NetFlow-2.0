import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Briefcase, Users, FileText, Receipt, ArrowRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../app/providers/AuthProvider'
import { cn } from '../../lib/utils'

interface SearchResult {
  id: string
  label: string
  description: string
  type: 'job' | 'client' | 'invoice' | 'expense'
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
      const [jobsRes, clientsRes, invoicesRes, expensesRes] = await Promise.all([
        supabase.from('jobs').select('id, title, client_id').eq('user_id', user.id).ilike('title', term).limit(5),
        supabase.from('clients').select('id, name').eq('user_id', user.id).ilike('name', term).limit(5),
        supabase.from('invoices').select('id, invoice_number, type').eq('user_id', user.id).ilike('invoice_number', term).limit(5),
        supabase.from('expenses').select('id, title, amount').eq('user_id', user.id).ilike('title', term).limit(5),
      ])

      const r: SearchResult[] = []
      jobsRes.data?.forEach((j) => r.push({ id: j.id, label: j.title, description: 'Lavoro', type: 'job', route: '/jobs' }))
      clientsRes.data?.forEach((c) => r.push({ id: c.id, label: c.name, description: 'Cliente', type: 'client', route: '/clients' }))
      invoicesRes.data?.forEach((inv) => r.push({ id: inv.id, label: `${inv.invoice_number} (${inv.type})`, description: 'Fattura', type: 'invoice', route: '/invoicing' }))
      expensesRes.data?.forEach((e) => r.push({ id: e.id, label: e.title, description: 'Spesa', type: 'expense', route: '/expenses' }))
      setResults(r)
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

  const iconMap = { job: Briefcase, client: Users, invoice: FileText, expense: Receipt } as const

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
                      i === selectedIndex ? 'bg-brand/20 text-text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
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
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">Digita per cercare in tutta l'app</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <kbd className="rounded-md border border-border px-2 py-0.5 text-xs text-text-secondary">⌘K</kbd>
                <span className="text-xs text-text-secondary">per aprire</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
