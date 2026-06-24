import { useState, useEffect } from 'react'
import { Copy, Check, Trash2, ExternalLink, Plus, Loader2, Edit3, Eye, EyeOff, ToggleLeft, ToggleRight, Shield, Lock } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { useShares, useCreateShare, useUpdateShare, useDeleteShare } from '../../../lib/hooks/useShares'
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
}

const initialForm: ShareFormData = {
  name: '',
  description: '',
  access_level: 'view',
  expiresIn: '30',
  password: '',
  maxViews: '',
  sections: ['jobs', 'clients', 'invoices', 'expenses', 'quotes'],
}

export function SharesManager() {
  const { data: shares, isLoading } = useShares()
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
    })
    setEditingId(share.id)
    setShowForm(true)
  }

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

  function getShareUrl(token: string) {
    return `${window.location.origin}/shared/${token}`
  }

  async function toggleActive(share: Share) {
    await updateShare.mutateAsync({ id: share.id, is_active: !share.is_active })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">Gestisci i link di condivisione</p>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
          <Plus className="h-3.5 w-3.5" /> Nuovo Link
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-surface/60 backdrop-blur-xl p-5">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="h-5 w-5 text-brand" />
            <span className="text-sm font-semibold text-text-primary">
              {editingId ? 'Modifica link' : 'Nuovo link di condivisione'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome (opzionale)</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="es. Commercialista 2026"
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrizione (opzionale)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="es. Link per commercialista"
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

          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                <Lock className="inline h-3.5 w-3.5 mr-1" />
                Protezione password (opzionale)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Lascia vuoto per accesso libero"
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
          )}

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

      {shares?.map((share) => (
        <div
          key={share.id}
          className={`rounded-2xl border ${share.is_active ? 'border-white/[0.06]' : 'border-white/[0.03]'} bg-surface/60 backdrop-blur-xl px-4 py-3.5 transition-all duration-200 ${
            !share.is_active ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${
              share.is_active ? 'bg-brand/10' : 'bg-surface/80'
            }`}>
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
                <span className="text-[11px] text-text-secondary">
                  {share.view_count} visite
                </span>
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
                  navigator.clipboard.writeText(getShareUrl(share.token))
                  setCopiedId(share.id)
                }}
                className="rounded-full p-2 text-text-secondary hover:bg-surface/80 transition-colors"
                title="Copia link"
              >
                {copiedId === share.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={getShareUrl(share.token)}
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
  )
}
