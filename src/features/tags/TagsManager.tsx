import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { Button } from '../../shared/ui/Button'
import { useTags, useCreateTag, useDeleteTag } from '../../lib/hooks/useTags'

const presetColors = ['#6C5CE7', '#00B894', '#FF6B6B', '#00D2FF', '#FDCB6E', '#E17055', '#A0A0B8', '#636E72']

export function TagsManager() {
  const { data: tags } = useTags()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6C5CE7')
  const [showForm, setShowForm] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await createTag.mutateAsync({ name: newName.trim(), color: newColor })
    setNewName('')
    setNewColor('#6C5CE7')
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tag</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" /> {showForm ? 'Chiudi' : 'Nuovo Tag'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-xl bg-white/5">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="es. progetto-alpha"
              className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm backdrop-blur-xl focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Colore</label>
            <div className="flex gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${newColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" size="sm" disabled={!newName.trim()}>
            {createTag.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Crea Tag
          </Button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <button onClick={() => deleteTag.mutate(tag.id)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TagSelector({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { data: tags } = useTags()

  function toggle(tagId: string) {
    if (selected.includes(tagId)) {
      onChange(selected.filter((id) => id !== tagId))
    } else {
      onChange([...selected, tagId])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggle(tag.id)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            selected.includes(tag.id) ? 'ring-1 ring-white' : 'opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: tag.color + '20', color: tag.color }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}
