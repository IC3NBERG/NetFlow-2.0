import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { ShareMessage } from '../../types/database'

interface ClientPortalData {
  profile: Record<string, unknown> | null
  client: Record<string, unknown> | null
  jobs: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  quotes: Record<string, unknown>[]
  share: Record<string, unknown>
}

export function useClientPortalData(token: string | undefined) {
  return useQuery({
    queryKey: ['client_portal_data', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_client_portal_data', { p_token: token })
      if (error) throw error
      return data as unknown as ClientPortalData
    },
    enabled: !!token,
    retry: 1,
  })
}

export function useShareMessages(token: string | undefined) {
  return useQuery({
    queryKey: ['share_messages', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_share_messages', { p_token: token })
      if (error) throw error
      return (data ?? []) as unknown as ShareMessage[]
    },
    enabled: !!token,
    refetchInterval: 8000, // poll every 8 seconds
  })
}

export function useSendShareMessage(token: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sender,
      content,
      senderName,
    }: {
      sender: 'owner' | 'client'
      content: string
      senderName?: string
    }) => {
      const { data, error } = await supabase.rpc('send_share_message', {
        p_token: token,
        p_sender: sender,
        p_content: content,
        p_sender_name: senderName ?? null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share_messages', token] })
    },
  })
}

export function useMarkShareMessagesRead(token: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_share_messages_read', { p_token: token })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share_messages', token] })
    },
  })
}
