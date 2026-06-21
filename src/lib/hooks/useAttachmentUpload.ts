import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../../app/providers/AuthProvider'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function useAttachmentUpload() {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)

  async function upload(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File troppo grande (max 5MB)`)
    }
    if (!user) throw new Error('Utente non autenticato')

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file)

      if (uploadError) {
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
          throw new Error('Storage non configurato. Usa un link esterno come alternativa.')
        }
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(path)

      return urlData.publicUrl
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading }
}
