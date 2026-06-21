import { useState } from 'react'
import { Plus, Link, Paperclip, X, Loader2, ExternalLink, Image } from 'lucide-react'
import { Button } from './Button'
import { useAttachmentUpload } from '../../lib/hooks/useAttachmentUpload'

interface AttachmentsFieldProps {
  urls: string[]
  onChange: (urls: string[]) => void
}

export function AttachmentsField({ urls, onChange }: AttachmentsFieldProps) {
  const { upload, uploading } = useAttachmentUpload()
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  async function handleFileSelect() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return
      for (const file of Array.from(files)) {
        try {
          const url = await upload(file)
          onChange([...urls, url])
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Errore upload')
        }
      }
    }
    input.click()
  }

  function handleAddLink() {
    if (!linkValue.trim()) return
    try { new URL(linkValue.trim()) } catch { return }
    onChange([...urls, linkValue.trim()])
    setLinkValue('')
    setShowLinkInput(false)
  }

  function handleRemove(index: number) {
    onChange(urls.filter((_, i) => i !== index))
  }

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">Allegati</label>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="group relative rounded-xl bg-white/5 px-3 py-2 pr-8 text-xs">
              {isImage(url) ? (
                <div className="flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-brand shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[120px] hover:text-brand">
                    allegato-{i + 1}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[120px] hover:text-brand">
                    {url.split('/').pop()?.slice(0, 20) || 'link'}
                  </a>
                </div>
              )}
              <button onClick={() => handleRemove(i)} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3 text-expense" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={handleFileSelect} disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          File
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowLinkInput(!showLinkInput)}>
          <Link className="h-3.5 w-3.5" /> Link
        </Button>
      </div>

      {showLinkInput && (
        <div className="flex gap-2">
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://drive.google.com/..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
            className="flex-1 rounded-xl border border-border bg-surface/60 px-3 py-1.5 text-sm backdrop-blur-xl focus:border-brand focus:outline-none"
          />
          <Button type="button" size="sm" onClick={handleAddLink}>
            <ExternalLink className="h-3.5 w-3.5" /> Aggiungi
          </Button>
        </div>
      )}

      <p className="text-[10px] text-text-secondary">
        Carica file (max 5MB) o incolla link da Google Drive/Dropbox. Gli allegati sono visibili solo a te.
      </p>
    </div>
  )
}
