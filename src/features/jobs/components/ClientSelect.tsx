import { useState } from 'react'
import { useClients, useCreateClient } from '../../../lib/hooks/useClients'
import { Input } from '../../../shared/ui/Input'
import { Button } from '../../../shared/ui/Button'
import { Plus, Check, ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface ClientSelectProps {
  value: string | null
  onChange: (clientId: string | null) => void
  error?: string
}

export function ClientSelect({ value, onChange, error }: ClientSelectProps) {
  const { data: clients = [] } = useClients()
  const createClient = useCreateClient()
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [fiscalCode, setFiscalCode] = useState('')

  const selected = clients.find((c) => c.id === value)

  async function handleCreate() {
    if (!name.trim()) return
    const result = await createClient.mutateAsync({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      vat_number: vatNumber || null,
      fiscal_code: fiscalCode || null,
      address: null,
      notes: null,
      color: null,
    })
    onChange(result.id)
    setShowCreate(false)
    setName('')
    setEmail('')
    setPhone('')
    setVatNumber('')
    setFiscalCode('')
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm text-text-secondary">Cliente</label>
      {showCreate ? (
        <div className="space-y-3 rounded-card border border-border bg-surface p-4">
          <Input
            placeholder="Nome cliente *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Partita IVA" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
            <Input placeholder="Codice Fiscale" value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Annulla</Button>
            <Button size="sm" disabled={!name.trim() || createClient.isPending} onClick={handleCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Crea cliente
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-full rounded-input border px-4 py-3 bg-surface text-left flex items-center justify-between transition-all',
              error ? 'border-expense' : 'border-border',
              'focus:outline-none focus:ring-2 focus:ring-brand',
            )}
          >
            <span className={selected ? 'text-text-primary flex items-center gap-2' : 'text-text-secondary/50'}>
              {selected ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color ?? '#6C5CE7' }} />
                  {selected.name}
                </>
              ) : 'Seleziona cliente'}
            </span>
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute z-20 mt-1 w-full rounded-card border border-border bg-surface shadow-2xl">
                <div className="max-h-48 overflow-y-auto p-1">
                  {clients.length === 0 && (
                    <p className="p-3 text-sm text-text-secondary">Nessun cliente</p>
                  )}
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => { onChange(client.id); setIsOpen(false) }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 shrink-0 rounded-full"
                          style={{ backgroundColor: client.color ?? '#6C5CE7' }}
                        />
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.email && <p className="text-xs text-text-secondary">{client.email}</p>}
                        </div>
                      </div>
                      {client.id === value && <Check className="h-4 w-4 text-brand" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border p-2">
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setShowCreate(true) }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand hover:bg-surface/80 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Nuovo cliente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {error && <p className="text-sm text-expense">{error}</p>}
    </div>
  )
}
