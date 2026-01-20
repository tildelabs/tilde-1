import { useState, useRef, useEffect } from 'react'
import { saveAttachment, getThumbnailUrl, getAttachmentUrl } from '@/storage/attachments'
import type { Attachment } from '@/storage/db'
import { hapticImpact, hapticSelection } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface InputBarProps {
  onSend: (content: string, attachmentIds?: string[]) => void
  onStop: () => void
  isStreaming: boolean
  conversationId: string
}

export function InputBar({ onSend, onStop, isStreaming, conversationId }: InputBarProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend = text.trim() || attachments.length > 0

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSend = () => {
    if (!canSend || isStreaming) return

    hapticImpact('medium')
    const attachmentIds = attachments.map(a => a.id)
    onSend(text.trim(), attachmentIds.length > 0 ? attachmentIds : undefined)
    setText('')
    setAttachments([])

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    hapticSelection()

    // Use a temporary ID if no conversation exists yet
    const attachConvoId = conversationId || 'temp-' + Date.now()

    for (const file of files) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const attachment = await saveAttachment(attachConvoId, 0, file)
        setAttachments(prev => [...prev, attachment])
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    hapticSelection()
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 safe-bottom px-4 pb-3 pt-2">
      {/* Floating Input Container */}
      <div className="liquid-glass rounded-[28px] overflow-hidden">
        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-hide">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="relative flex-shrink-0 animate-scale-in"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/50 border border-white/30">
                  {attachment.type === 'image' && (
                    <img
                      src={getThumbnailUrl(attachment) || getAttachmentUrl(attachment)}
                      alt={attachment.filename}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {attachment.type === 'pdf' && (
                    <div className="w-full h-full flex items-center justify-center bg-white/70">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-text-primary/90 rounded-full flex items-center justify-center text-white pressable shadow-sm"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end gap-2 p-2">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className={cn(
              'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center',
              'bg-white/60 text-text-secondary pressable border border-white/40',
              'disabled:opacity-50 disabled:pointer-events-none',
              'transition-all duration-200'
            )}
            aria-label="Add attachment"
          >
            <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            capture="environment"
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isStreaming}
              rows={1}
              className={cn(
                'w-full px-4 py-3 rounded-[22px] resize-none',
                'text-text-primary placeholder:text-text-secondary/40 font-mono text-base',
                'outline-none transition-all duration-200',
                'disabled:opacity-50',
                'max-h-[120px]',
                'bg-white/70 border border-white/40',
                'focus:bg-white/90 focus:border-accent/20'
              )}
            />
          </div>

          {/* Send/Stop Button */}
          {isStreaming ? (
            <button
              onClick={() => {
                hapticImpact('medium')
                onStop()
              }}
              className={cn(
                'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center',
                'bg-red-500/90 text-white pressable',
                'shadow-lg shadow-red-500/25'
              )}
              aria-label="Stop"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center',
                'transition-all duration-200 pressable',
                canSend
                  ? 'floating-glass-btn-accent text-white shadow-lg shadow-accent/25'
                  : 'bg-white/50 text-text-secondary/30 border border-white/30'
              )}
              aria-label="Send"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
