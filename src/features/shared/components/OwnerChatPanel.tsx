import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, CheckCheck, Shield } from 'lucide-react'
import { useShareMessages, useSendShareMessage, useMarkShareMessagesRead } from '../../../lib/hooks/useClientPortal'
import type { ShareMessage } from '../../../types/database'

interface OwnerChatPanelProps {
  token: string
  clientName: string
  ownerName: string
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export function OwnerChatPanel({ token, clientName, ownerName }: OwnerChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages = [] } = useShareMessages(token)
  const sendMessage = useSendShareMessage(token)
  const markRead = useMarkShareMessagesRead(token)

  const unreadCount = (messages as ShareMessage[]).filter(m => m.sender === 'client' && !m.read_at).length

  useEffect(() => {
    if (isOpen) {
      markRead.mutate()
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [messages, isOpen])

  async function handleSend() {
    if (!message.trim()) return
    await sendMessage.mutateAsync({ sender: 'owner', content: message.trim(), senderName: ownerName })
    setMessage('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3.5 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-alt hover:border-brand/40 hover:text-brand"
        title="Chat con il cliente"
      >
        <MessageCircle className="h-4 w-4" />
        <span>Chat</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-black">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="fixed inset-0 m-auto z-50 flex h-[80vh] max-h-[600px] w-[400px] max-w-[calc(100vw-32px)] flex-col rounded-[1.75rem] border border-border/60 bg-surface/95 shadow-[0_32px_80px_rgba(0,0,0,0.4)] backdrop-blur-3xl overflow-hidden"
            >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/40 bg-brand/10 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 ring-1 ring-brand/30">
                <Shield className="h-4 w-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">Chat con {clientName}</p>
                <p className="text-[10px] text-text-secondary">Canale portale cliente</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-text-secondary/60 hover:bg-surface/80 hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {(messages as ShareMessage[]).length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-50">
                  <MessageCircle className="h-8 w-8 text-text-secondary" />
                  <p className="text-xs text-text-secondary">Nessun messaggio ancora.</p>
                </div>
              )}
              {(messages as ShareMessage[]).map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    msg.sender === 'owner'
                      ? 'bg-brand text-black rounded-br-sm'
                      : 'bg-surface-alt/80 text-text-primary rounded-bl-sm border border-border/40'
                  }`}>
                    {msg.sender === 'client' && (
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-60">{msg.sender_name ?? clientName}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-[10px] opacity-60">{formatTime(msg.created_at)}</p>
                      {msg.sender === 'owner' && msg.read_at && (
                        <CheckCheck className="h-3 w-3 opacity-60" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Rispondi a ${clientName}...`}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all min-h-[40px] max-h-[120px]"
                  onInput={e => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-black transition-all hover:opacity-90 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
