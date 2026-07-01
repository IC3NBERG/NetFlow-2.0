import { useState, useEffect } from 'react'
import { Copy, Check, Trash2, ExternalLink, Plus, Loader2, Edit3, Eye, EyeOff, ToggleLeft, ToggleRight, Shield, Lock, User, MessageCircle } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { useShares, useCreateShare, useUpdateShare, useDeleteShare } from '../../../lib/hooks/useShares'
import { useClients } from '../../../lib/hooks/useClients'
import { useShareMessages } from '../../../lib/hooks/useClientPortal'
import { OwnerChatPanel } from '../../shared/components/OwnerChatPanel'
import { useAuth } from '../../../app/providers/AuthProvider'
import type { Share, ShareSection } from '../../../types/database'
import { SHARE_SECTIONS } from '../../../types/database'

interface ShareFormData {
  name: string
  description: string
  access_level: 'view' | 'export'
  expiresIn: string
  password: string
  maxViews: string
  sections: ShareSection[]
  client_id: string
}

const initialForm: ShareFormData = {
  name: '',
  description: '',
  access_level: 'view',
  expiresIn: '30',
  password: '',
  maxViews: '',
  sections: ['jobs', 'clients', 'invoices', 'expenses', 'quotes'],
  client_id: '',
}

function ShareUnreadBadge({ token }: { token: string }) {
  const { data: messages = [] } = useShareMessages(token)
  const count = (messages as any[]).filter((m: any) => m.sender === 'client' && !m.read_at).length
  if (count === 0) return null
  return (
    <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-black">
      {count}
    </span>
  )
}

export function SharesManager() {
  const { data: shares, isLoading } = useShares()
  const { data: clients = [] } = useClients()
  const { user } = useAuth()
  const createShare = useCreateShare()
  const updateShare = useUpdateShare()
  const deleteShare = useDeleteShare()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<ShareFormData>(initialForm)

  useEffect(() => {
    if (copiedId) {
      const t = setTimeout(() => setCopiedId(null), 2000)
      return () => clearTimeout(t)
    }
  }, [copiedId])

  function resetForm() {
    setForm(initialForm)
    setShowPassword(false)
    setEditingId(null)
  }

  function startEdit(share: Share) {
    setForm({
      name: share.name || '',
      description: share.description || '',
      access_level: share.access_level,
      expiresIn: share.expires_at ? String(Math.round((new Date(share.expires_at).getTime() - Date.now()) / 86400000)) : '',
      password: '',
      maxViews: share.max_views ? String(share.max_views) : '',
      sections: share.sections || ['jobs', 'clients', 'invoices', 'expenses', 'quotes'],
      client_id: share.client_id || '',
    })
    setEditingId(share.id)
    setShowForm(true)
  }

  const isClientPortal = !!form.client_id

  async function handleSave() {
    const expiresAt = form.expiresIn
      ? new Date(Date.now() + parseInt(form.expiresIn) * 86400000).toISOString()
      : undefined

    if (editingId) {
      await updateShare.mutateAsync({
        id: editingId,
        name: form.name || undefined,
        description: form.description || null,
        access_level: form.access_level,
        expires_at: expiresAt || null,
        max_views: form.maxViews ? parseInt(form.maxViews) : null,
        sections: form.sections,
        password: form.password || undefined,
      })
    } else {
      await createShare.mutateAsync({
        name: form.name || undefined,
        description: form.description || undefined,
        access_level: form.access_level,
        expires_at: expiresAt,
        password: form.password || undefined,
        max_views: form.maxViews ? parseInt(form.maxViews) : undefined,
        sections: form.sections,
        client_id: form.client_id || undefined,
      })
    }
    resetForm()
    setShowForm(false)
  }

  function toggleSection(section: ShareSection) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }))
  }

  function getShareUrl(share: Share) {
    if (share.client_id) {
      return `${window.location.origin}/client-portal/${share.token}`
    }
    return `${window.location.origin}/shared/${share.token}`
  }

  async function toggleActive(share: Share) {
    await updateShare.mutateAsync({ id: share.id, is_active: !share.is_active })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
    </div>
  )

  const ownerName = user?.business_name || user?.full_name || 'Tu'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Gestisci i link di condivisione e i portali cliente</p>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
          <Plus className="h-3.5 w-3.5" /> Nuovo Link
        </Button>
      </div>

      {showForm && (
        <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-surface/60 backdrop-blur-xl p-5">
          <div className="flex items-center gap-3 mb-1">
            {isClientPortal ? <User className="h-5 w-5 text-brand" /> : <Shield className="h-5 w-5 text-brand" />}
            <span className="text-sm font-semibold text-text-primary">
              {editingId ? 'Modifica link' : isClientPortal ? 'Portale Cliente' : 'Nuovo link di condivisione'}
            </span>
            {isClientPortal && (
              <span className="ml-auto rounded-full bg-brand/15 border border-brand/30 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                Portale Cliente
              </span>
            )}
          </div>

          {/* Client selector — makes it a client portal */}
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                <User className="inline h-3.5 w-3.5 mr-1" />
                Portale per cliente (opzionale)
              </label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              >
                <option value="">— Link generico (commercialista, export...) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {isClientPortal && (
                <p className="text-xs text-brand/80 mt-1.5">
                  ✓ Verrà creato un <strong>portale dedicato</strong> per questo cliente, con chat integrata e accesso solo ai suoi dati.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome (opzionale)</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={isClientPortal ? 'es. Portale Mario Rossi' : 'es. Commercialista 2026'}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrizione (opzionale)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={isClientPortal ? 'es. Link per il cliente' : 'es. Link per commercialista'}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Accesso</label>
              <select
                value={form.access_level}
                onChange={(e) => setForm({ ...form, access_level: e.target.value as 'view' | 'export' })}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              >
                <option value="view">Solo lettura</option>
                <option value="export">Lettura + Export</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Scade tra</label>
              <select
                value={form.expiresIn}
                onChange={(e) => setForm({ ...form, expiresIn: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              >
                <option value="7">7 giorni</option>
                <option value="30">30 giorni</option>
                <option value="90">90 giorni</option>
                <option value="">Mai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Max visite</label>
              <input
                type="number"
                min="0"
                value={form.maxViews}
                onChange={(e) => setForm({ ...form, maxViews: e.target.value })}
                placeholder="Illimitate"
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              <Lock className="inline h-3.5 w-3.5 mr-1" />
              {editingId ? 'Nuova password (lascia vuoto per mantenere)' : 'Protezione password (opzionale)'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Lascia vuoto per non cambiare' : 'Lascia vuoto per accesso libero'}
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Sections — hidden when client portal */}
          {!isClientPortal && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Sezioni da condividere</label>
              <div className="flex flex-wrap gap-2">
                {SHARE_SECTIONS.map((section) => {
                  const active = form.sections.includes(section.key)
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'bg-brand/20 text-brand border border-brand/30'
                          : 'bg-surface/80 text-text-secondary border border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {section.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => { resetForm(); setShowForm(false) }} className="rounded-full">
              Annulla
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createShare.isPending || updateShare.isPending}
              className="rounded-full"
            >
              {(createShare.isPending || updateShare.isPending) ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : editingId ? (
                'Salva modifiche'
              ) : isClientPortal ? (
                'Crea Portale Cliente'
              ) : (
                'Crea Link'
              )}
            </Button>
          </div>
        </div>
      )}

      {(!shares || shares.length === 0) && !showForm && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="rounded-full bg-surface/60 p-3">
            <Shield className="h-5 w-5 text-text-secondary/50" />
          </div>
          <p className="text-sm text-text-secondary">Nessun link di condivisione attivo</p>
          <Button size="sm" variant="ghost" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="h-3.5 w-3.5" /> Crea il primo link
          </Button>
        </div>
      )}

      {(() => {
        const clientPortals = shares?.filter(s => !!s.client_id) || []
        const genericShares = shares?.filter(s => !s.client_id) || []

        return (
          <div className="space-y-8 mt-6">
            {clientPortals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Portali Clienti
                </h3>
                {clientPortals.map((share) => {
                  const client = clients.find(c => c.id === share.client_id)
                  return (
                    <div
                      key={share.id}
                      className={`rounded-2xl border ${share.is_active ? 'border-brand/30' : 'border-white/[0.03]'} bg-brand/5 backdrop-blur-xl px-4 py-3.5 transition-all duration-200 ${!share.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${share.is_active ? 'bg-brand/20' : 'bg-surface/80'}`}>
                          <User className={`h-4 w-4 ${share.is_active ? 'text-brand' : 'text-text-secondary/50'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {share.name || (client ? `Portale ${client.name}` : share.description) || 'Portale Cliente'}
                            </p>
                            <span className="shrink-0 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                              Portale {client?.name ?? 'Cliente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-text-secondary">
                              {share.access_level === 'view' ? 'Sola lettura' : 'Lettura + Export'}
                            </span>
                            {share.expires_at && (
                              <>
                                <span className="text-[11px] text-text-secondary">·</span>
                                <span className="text-[11px] text-text-secondary">
                                  Scade il {new Date(share.expires_at).toLocaleDateString('it-IT')}
                                </span>
                              </>
                            )}
                            <span className="text-[11px] text-text-secondary">·</span>
                            <span className="text-[11px] text-text-secondary">{share.view_count} visite</span>
                            {!!share.password_hash && (
                              <>
                                <span className="text-[11px] text-text-secondary">·</span>
                                <Lock className="h-3 w-3 text-pending" />
                              </>
                            )}
                            <span className="text-[11px] text-brand/80 flex items-center gap-0.5">
                              · <MessageCircle className="h-3 w-3" /> Chat attiva
                              <ShareUnreadBadge token={share.token} />
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {share.is_active && (
                            <OwnerChatPanel
                              token={share.token}
                              clientName={client?.name ?? 'Cliente'}
                              ownerName={ownerName}
                            />
                          )}
                          <button
                            onClick={() => toggleActive(share)}
                            className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                            title={share.is_active ? 'Disattiva portale' : 'Attiva portale'}
                          >
                            {share.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => startEdit(share)}
                            className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                            title="Modifica"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getShareUrl(share))
                              setCopiedId(share.id)
                            }}
                            className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                            title="Copia link"
                          >
                            {copiedId === share.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <a
                            href={getShareUrl(share)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                            title="Apri portale"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => deleteShare.mutate(share.id)}
                            className="rounded-full p-2 text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors"
                            title="Elimina portale"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {genericShares.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Condivisioni Classiche
                </h3>
                {genericShares.map((share) => (
                  <div
                    key={share.id}
                    className={`rounded-2xl border ${share.is_active ? 'border-white/[0.06]' : 'border-white/[0.03]'} bg-surface/60 backdrop-blur-xl px-4 py-3.5 transition-all duration-200 ${!share.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${share.is_active ? 'bg-brand/10' : 'bg-surface/80'}`}>
                        <Shield className={`h-4 w-4 ${share.is_active ? 'text-brand' : 'text-text-secondary/50'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {share.name || share.description || 'Link di condivisione'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-text-secondary">
                            {share.access_level === 'view' ? 'Sola lettura' : 'Lettura + Export'}
                          </span>
                          {share.expires_at && (
                            <>
                              <span className="text-[11px] text-text-secondary">·</span>
                              <span className="text-[11px] text-text-secondary">
                                Scade il {new Date(share.expires_at).toLocaleDateString('it-IT')}
                              </span>
                            </>
                          )}
                          <span className="text-[11px] text-text-secondary">·</span>
                          <span className="text-[11px] text-text-secondary">{share.view_count} visite</span>
                          {!!share.password_hash && (
                            <>
                              <span className="text-[11px] text-text-secondary">·</span>
                              <Lock className="h-3 w-3 text-pending" />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(share)}
                          className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                          title={share.is_active ? 'Disattiva link' : 'Attiva link'}
                        >
                          {share.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(share)}
                          className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                          title="Modifica"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(getShareUrl(share))
                            setCopiedId(share.id)
                          }}
                          className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                          title="Copia link"
                        >
                          {copiedId === share.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <a
                          href={getShareUrl(share)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
