import { useState, useEffect, useRef, useCallback } from 'react'
import { Page, f7 } from 'framework7-react'
import { getConversation, getMessages, addMessage, updateLastMessage, createConversation } from '@/storage/conversations'
import { getAttachment, fileToBase64 } from '@/storage/attachments'
import { streamMessage, type ClaudeMessage, type ClaudeContent } from '@/brain/claude'
import { buildSystemPrompt } from '@/brain/prompts'
import type { Message } from '@/storage/markdown'
import { InputBar } from './InputBar'
import { MessageBubble } from './Message'
import { hapticNotification, hapticImpact } from '@/lib/haptics'

interface ChatViewProps {
  f7route?: { params: { id?: string } }
}

export function ChatView({ f7route }: ChatViewProps) {
  const routeId = f7route?.params?.id
  const [conversationId, setConversationId] = useState<string | null>(routeId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Create a new conversation if we're on the main page without an ID
  useEffect(() => {
    async function initConversation() {
      if (routeId) {
        // Load existing conversation
        const conversation = await getConversation(routeId)
        if (!conversation) {
          // Conversation not found, create new one
          const newConvo = await createConversation()
          setConversationId(newConvo.id)
          setMessages([])
          return
        }
        setConversationId(routeId)
        const msgs = await getMessages(routeId)
        setMessages(msgs)
      } else {
        // Main page - create a fresh conversation
        const newConvo = await createConversation()
        setConversationId(newConvo.id)
        setMessages([])
      }
    }
    initConversation()
  }, [routeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = useCallback(async (content: string, attachmentIds?: string[]) => {
    if (!conversationId || (!content.trim() && !attachmentIds?.length)) return

    setError(null)

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachmentIds,
    }
    setMessages(prev => [...prev, userMessage])
    await addMessage(conversationId, 'user', content.trim(), attachmentIds)

    // Prepare messages for Claude
    const claudeMessages: ClaudeMessage[] = []

    for (const msg of [...messages, userMessage]) {
      const msgContent: ClaudeContent[] = []

      // Add attachments as images
      if (msg.attachmentIds?.length) {
        for (const attachmentId of msg.attachmentIds) {
          const attachment = await getAttachment(attachmentId)
          if (attachment && attachment.type === 'image') {
            const base64 = await fileToBase64(attachment.blob)
            msgContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: attachment.mimeType,
                data: base64,
              },
            })
          }
        }
      }

      // Add text content
      if (msg.content) {
        msgContent.push({ type: 'text', text: msg.content })
      }

      claudeMessages.push({
        role: msg.role,
        content: msgContent.length === 1 && msgContent[0]?.type === 'text'
          ? msg.content
          : msgContent,
      })
    }

    // Start streaming response
    setIsStreaming(true)
    setStreamingContent('')

    // Add placeholder assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])
    await addMessage(conversationId, 'assistant', '')

    abortControllerRef.current = new AbortController()

    const systemPrompt = await buildSystemPrompt()

    await streamMessage(
      claudeMessages,
      systemPrompt,
      {
        onToken: (token) => {
          setStreamingContent(prev => prev + token)
        },
        onComplete: async (fullText) => {
          setIsStreaming(false)
          setStreamingContent('')
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === 'assistant') {
              last.content = fullText
            }
            return updated
          })
          await updateLastMessage(conversationId, fullText)
          hapticNotification('success')
        },
        onError: (err) => {
          setIsStreaming(false)
          setStreamingContent('')
          setError(err.message)
          // Remove the empty assistant message
          setMessages(prev => prev.slice(0, -1))
          hapticNotification('error')
        },
      },
      abortControllerRef.current.signal
    )
  }, [conversationId, messages])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const handleHistory = async () => {
    await hapticImpact('light')
    f7.views.main.router.navigate('/history')
  }

  const handleSettings = async () => {
    await hapticImpact('light')
    f7.views.main.router.navigate('/settings')
  }

  const handleNewChat = async () => {
    await hapticImpact('medium')
    const newConvo = await createConversation()
    setConversationId(newConvo.id)
    setMessages([])
    setError(null)
  }

  return (
    <Page className="bg-white h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 safe-top bg-white/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: History button */}
          <button
            onClick={handleHistory}
            className="w-10 h-10 flex items-center justify-center text-accent pressable"
            aria-label="History"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Center: Logo */}
          <div className="flex items-center gap-2">
            <img src="/tilde-logo.png" alt="tilde" className="w-8 h-8 rounded-lg" />
          </div>

          {/* Right: New chat / Settings */}
          <div className="flex items-center">
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="w-10 h-10 flex items-center justify-center text-accent pressable"
                aria-label="New chat"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            )}
            <button
              onClick={handleSettings}
              className="w-10 h-10 flex items-center justify-center text-accent pressable"
              aria-label="Settings"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-container scrollbar-hide px-4 py-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
            <img src="/tilde-logo.png" alt="tilde" className="w-16 h-16 rounded-2xl mb-4" />
            <p className="text-text-secondary font-mono">
              How can I help you today?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isStreaming={
                  isStreaming &&
                  index === messages.length - 1 &&
                  message.role === 'assistant'
                }
                streamingContent={
                  isStreaming && index === messages.length - 1
                    ? streamingContent
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-mono animate-fade-in">
            {error}
          </div>
        )}
      </div>

      {/* Input - Always visible */}
      <InputBar
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        conversationId={conversationId || ''}
      />
    </Page>
  )
}
