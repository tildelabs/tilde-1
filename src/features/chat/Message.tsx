import { useState, useEffect } from 'react'
import type { Message } from '@/storage/markdown'
import { getAttachment, getThumbnailUrl, getAttachmentUrl } from '@/storage/attachments'
import type { Attachment } from '@/storage/db'
import { cn, formatTime } from '@/lib/utils'
import { hapticImpact } from '@/lib/haptics'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const content = isStreaming ? (streamingContent || '') : message.content
  const isUser = message.role === 'user'

  useEffect(() => {
    if (message.attachmentIds?.length) {
      Promise.all(
        message.attachmentIds.map(id => getAttachment(id))
      ).then(results => {
        setAttachments(results.filter((a): a is Attachment => a !== undefined))
      })
    }
  }, [message.attachmentIds])

  const handleCopy = async () => {
    await hapticImpact('light')
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex flex-col animate-slide-up',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className={cn(
          'flex gap-2 mb-2 overflow-x-auto scrollbar-hide max-w-full',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          {attachments.map(attachment => (
            <button
              key={attachment.id}
              onClick={() => setPreviewUrl(getAttachmentUrl(attachment))}
              className="flex-shrink-0 rounded-2xl overflow-hidden liquid-glass-subtle pressable"
            >
              {attachment.type === 'image' && (
                <img
                  src={getThumbnailUrl(attachment) || getAttachmentUrl(attachment)}
                  alt={attachment.filename}
                  className="w-32 h-32 object-cover"
                />
              )}
              {attachment.type === 'pdf' && (
                <div className="w-32 h-32 flex flex-col items-center justify-center p-3 bg-white/50">
                  <svg className="w-8 h-8 text-red-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h2v4h-2v-4zm4 0h2v4h-2v-4z"/>
                  </svg>
                  <span className="text-xs text-text-secondary truncate w-full text-center font-mono">
                    {attachment.filename}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Message content */}
      {(content || isStreaming) && (
        isUser ? (
          // User message - bubble style
          <div className="max-w-[85%] px-4 py-3 rounded-[22px] liquid-glass-accent text-white rounded-br-lg">
            <div className="whitespace-pre-wrap break-words text-base leading-relaxed font-mono">
              {content}
            </div>
          </div>
        ) : (
          // AI message - no bubble, direct on interface
          <div className="w-full">
            <div className="whitespace-pre-wrap break-words text-base leading-relaxed font-mono text-text-primary">
              {content}
              {isStreaming && !content && (
                <span className="flex items-center gap-1.5 py-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              )}
              {isStreaming && content && (
                <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse rounded-full" />
              )}
            </div>
            
            {/* Actions row for AI messages - only show when not streaming */}
            {!isStreaming && content && (
              <div className="flex items-center gap-1 mt-3">
                <button
                  onClick={handleCopy}
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center transition-all pressable',
                    copied
                      ? 'bg-green-100 text-green-600'
                      : 'text-text-secondary/40 hover:text-text-secondary hover:bg-surface'
                  )}
                  aria-label="Copy"
                >
                  {copied ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Timestamp - only for user messages */}
      {isUser && (
        <span className="text-xs text-text-secondary/50 mt-1.5 px-1 font-mono text-right">
          {formatTime(message.timestamp)}
        </span>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewUrl(null)}
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)' }}
        >
          <button
            className="absolute top-4 right-4 w-11 h-11 rounded-full floating-glass-btn flex items-center justify-center text-white/90 safe-top"
            onClick={() => setPreviewUrl(null)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
