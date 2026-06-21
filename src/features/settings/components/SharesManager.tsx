import { useState, useEffect } from 'react'
import { Copy, Check, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { useShares, useCreateShare, useDeleteShare } from '../../../lib/hooks/useShares'

export function SharesManager() {
  const { data: shares, isLoading } = useShares()
  const createShare = useCreateShare()
  const deleteShare = useDeleteShare()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [accessLevel, setAccessLevel] = useState<'view' | 'export'>('view')
  const [description, setDescription] = useState('')
  const [expiresIn, setExpiresIn] = useState('30')

  useEffect(() => {
    if (copiedId) {
      const t = setTimeout(() => setCopiedId(null), 2000)
      return () => clearTimeout(t)
    }
  }, [copiedId])

  async function handleCreate() {
    const expiresAt = expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 86400000).toISOString() : undefined
    await createShare.mutateAsync({ access_level: accessLevel, description: description || undefined, expires_at: expiresAt })
    setShowForm(false)
    setDescription('')
  }

  function getShareUrl(token: string) {
    return `${window.location.origin}/shared/${token}`
  }

  if (isLoading) return <p className="text-sm text-text-secondary">Caricamento...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Link di condivisione</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" /> Nuovo Link
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 p-4 rounded-xl bg-white/5">
          <div>
            <label className="block text-sm font-medium mb-1">Descrizione</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="es. Link per commercialista"
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Accesso</label>
              <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as 'view' | 'export')}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm">
                <option value="view">Solo lettura</option>
                <option value="export">Lettura + Export</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scade tra</label>
              <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm">
                <option value="7">7 giorni</option>
                <option value="30">30 giorni</option>
                <option value="90">90 giorni</option>
                <option value="">Mai</option>
              </select>
            </div>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={createShare.isPending}>
            {createShare.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Crea Link
          </Button>
        </div>
      )}

      {(!shares || shares.length === 0) && !showForm && (
        <p className="text-sm text-text-secondary text-center py-4">
          Nessun link di condivisione attivo
        </p>
      )}

      {shares?.map((share) => (
        <div key={share.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{share.description || 'Link di condivisione'}</p>
            <p className="text-xs text-text-secondary">
              {share.access_level === 'view' ? 'Solo lettura' : 'Lettura + Export'}
              {share.expires_at && ` · Scade il ${new Date(share.expires_at).toLocaleDateString('it-IT')}`}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(getShareUrl(share.token))
              setCopiedId(share.id)
            }}
            className="rounded-full p-2 text-text-secondary hover:bg-white/10 transition-colors"
            title="Copia link"
          >
            {copiedId === share.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={getShareUrl(share.token)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 text-text-secondary hover:bg-white/10 transition-colors"
            title="Apri link"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => deleteShare.mutate(share.id)}
            className="rounded-full p-2 text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors"
            title="Elimina link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
