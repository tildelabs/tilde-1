import { useState, useEffect } from 'react'
import type { Message } from '@/storage/markdown'
import { getAttachment, getThumbnailUrl, getAttachmentUrl } from '@/storage/attachments'
import type { Attachment } from '@/storage/db'
import { cn, formatTime } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
              className="flex-shrink-0 rounded-xl overflow-hidden bg-surface border border-border pressable"
            >
              {attachment.type === 'image' && (
                <img
                  src={getThumbnailUrl(attachment) || getAttachmentUrl(attachment)}
                  alt={attachment.filename}
                  className="w-32 h-32 object-cover"
                />
              )}
              {attachment.type === 'pdf' && (
                <div className="w-32 h-32 flex flex-col items-center justify-center p-3">
                  <svg className="w-8 h-8 text-red-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h2v4h-2v-4zm4 0h2v4h-2v-4z"/>
                  </svg>
                  <span className="text-xs text-text-secondary truncate w-full text-center">
                    {attachment.filename}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Message bubble */}
      {(content || isStreaming) && (
        <div
          className={cn(
            'max-w-[85%] px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-accent text-white rounded-br-md'
              : 'bg-surface text-text-primary rounded-bl-md'
          )}
        >
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed font-mono">
            {content}
            {isStreaming && !content && (
              <span className="flex items-center gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            )}
            {isStreaming && content && (
              <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <span className={cn(
        'text-xs text-text-secondary/60 mt-1 px-1 font-mono',
        isUser ? 'text-right' : 'text-left'
      )}>
        {formatTime(message.timestamp)}
      </span>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white pressable safe-top"
            onClick={() => setPreviewUrl(null)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
