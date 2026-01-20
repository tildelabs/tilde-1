import { useState, useEffect, useRef, useCallback } from 'react'
import { Page } from 'framework7-react'
import { getConversation, getMessages, addMessage, updateLastMessage, createConversation, updateConversationTitle } from '@/storage/conversations'
import { getAttachment, fileToBase64 } from '@/storage/attachments'
import { getProfile } from '@/storage/profile'
import { streamMessage, generateChatTitle, type ClaudeMessage, type ClaudeContent } from '@/brain/claude'
import { buildSystemPrompt } from '@/brain/prompts'
import type { Message } from '@/storage/markdown'
import { InputBar } from './InputBar'
import { MessageBubble } from './Message'
import { Sidebar } from '@/components/Sidebar'
import { SettingsSheet } from '@/components/SettingsSheet'
import { hapticNotification, hapticImpact } from '@/lib/haptics'

function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    const greetings = ['Good morning', 'Morning', 'Rise and shine']
    return greetings[Math.floor(Math.random() * greetings.length)] || 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    const greetings = ['Good afternoon', 'Hey there', 'Hope your day is going well']
    return greetings[Math.floor(Math.random() * greetings.length)] || 'Good afternoon'
  } else if (hour >= 17 && hour < 21) {
    const greetings = ['Good evening', 'Hey', 'Winding down?']
    return greetings[Math.floor(Math.random() * greetings.length)] || 'Good evening'
  } else {
    const greetings = ['Burning the midnight oil?', 'Late night?', 'Hey night owl']
    return greetings[Math.floor(Math.random() * greetings.length)] || 'Hey'
  }
}

interface ChatViewProps {
  f7route?: { params: { id?: string } }
}

export function ChatView({ f7route }: ChatViewProps) {
  const routeId = f7route?.params?.id
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [greeting] = useState<string>(getGreeting())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializedRef = useRef<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Load user profile
  useEffect(() => {
    getProfile().then(profile => {
      setUserName(profile.name || '')
    })
  }, [])

  // Load conversation when route changes
  useEffect(() => {
    async function initConversation() {
      // Prevent re-initialization for the same route
      const currentRouteKey = routeId || 'new'
      if (initializedRef.current === currentRouteKey) return
      initializedRef.current = currentRouteKey

      setIsLoading(true)
      setError(null)
      setStreamingContent('')
      setIsStreaming(false)

      if (routeId) {
        // Load existing conversation
        const conversation = await getConversation(routeId)
        if (!conversation) {
          // Conversation not found, start fresh (no conversation yet)
          setConversationId(null)
          setMessages([])
          setIsLoading(false)
          return
        }
        setConversationId(routeId)
        const msgs = await getMessages(routeId)
        setMessages(msgs)
        setIsLoading(false)
      } else {
        // Main page - start fresh without creating a conversation
        // Conversation will be created when user sends first message
        setConversationId(null)
        setMessages([])
        setIsLoading(false)
      }
    }
    initConversation()
  }, [routeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Handle scroll to show/hide scroll button
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom && messages.length > 0)
    }
  }, [messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = useCallback(async (content: string, attachmentIds?: string[]) => {
    if (!content.trim() && !attachmentIds?.length) return

    setError(null)

    // Create conversation if it doesn't exist
    let activeConversationId: string = conversationId || ''
    const isFirstMessage = !conversationId
    
    if (!conversationId) {
      const newConvo = await createConversation()
      activeConversationId = newConvo.id
      setConversationId(newConvo.id)
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachmentIds,
    }
    setMessages(prev => [...prev, userMessage])
    await addMessage(activeConversationId, 'user', content.trim(), attachmentIds)

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
    await addMessage(activeConversationId, 'assistant', '')

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
          await updateLastMessage(activeConversationId, fullText)
          
          // Generate title after first message exchange
          if (isFirstMessage) {
            const title = await generateChatTitle(content.trim(), fullText)
            await updateConversationTitle(activeConversationId, title)
          }
          
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

  const handleOpenSidebar = async () => {
    await hapticImpact('light')
    setSidebarOpen(true)
  }

  const handleNewChat = async () => {
    await hapticImpact('medium')
    initializedRef.current = null // Allow re-initialization
    setConversationId(null)
    setMessages([])
    setError(null)
    setStreamingContent('')
    setIsStreaming(false)
  }

  const handleSelectConversation = async (id: string) => {
    if (id === conversationId) return
    
    await hapticImpact('light')
    initializedRef.current = null // Allow re-initialization
    setIsLoading(true)
    setError(null)
    setStreamingContent('')
    setIsStreaming(false)

    const conversation = await getConversation(id)
    if (conversation) {
      setConversationId(id)
      const msgs = await getMessages(id)
      setMessages(msgs)
    }
    setIsLoading(false)
  }

  return (
    <Page className="bg-gradient-to-b from-white via-white to-gray-50/50 h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        currentConversationId={conversationId}
      />

      {/* Settings Sheet - rendered at top level for full screen */}
      <SettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Main Content - shifts when sidebar opens */}
      <div 
        className={`flex flex-col h-full transition-transform duration-300 ease-ios ${
          sidebarOpen ? 'translate-x-[80%] max-translate-x-[320px]' : 'translate-x-0'
        }`}
        style={{ transform: sidebarOpen ? 'translateX(min(80%, 320px))' : 'translateX(0)' }}
      >
        {/* Overlay when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/20 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Floating Top Actions - Minimal Glass Buttons */}
        <div className="fixed top-0 left-0 right-0 z-20 safe-top pointer-events-none">
        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          {/* Left: Menu button - hidden when sidebar is open */}
          {!sidebarOpen && (
            <button
              onClick={handleOpenSidebar}
              className="pointer-events-auto w-11 h-11 rounded-full floating-glass-btn flex items-center justify-center text-accent"
              aria-label="Menu"
            >
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.75 5.75C3.75 4.64543 4.64543 3.75 5.75 3.75H18.25C19.3546 3.75 20.25 4.64543 20.25 5.75V18.25C20.25 19.3546 19.3546 20.25 18.25 20.25H5.75C4.64543 20.25 3.75 19.3546 3.75 18.25V5.75Z" />
                <path d="M8.75 4V12V20" />
              </svg>
            </button>
          )}

          {/* Right: New chat button (only when messages exist) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="w-11 h-11 rounded-full floating-glass-btn flex items-center justify-center text-accent animate-scale-in"
                aria-label="New chat"
              >
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top blur gradient */}
      <div className="fixed top-0 left-0 right-0 h-24 pointer-events-none z-10 safe-top"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
        }}
      />

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-container scrollbar-hide px-4 pt-20 pb-36"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in px-8">
            <img
              src="/tilde-logo.png"
              alt="tilde"
              className="w-20 h-20 rounded-2xl mb-8 animate-float-up"
            />
            <h2 className="text-2xl font-semibold text-text-primary font-mono mb-3">
              {greeting}{userName ? `, ${userName}` : ''}
            </h2>
            <p className="text-text-secondary/60 font-mono text-base">
              What can I help you with?
            </p>
          </div>
        ) : (
          <div className="space-y-6">
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
          <div className="mt-4 p-4 liquid-glass border-red-200/50 text-red-600 text-sm font-mono animate-fade-in rounded-2xl">
            {error}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed left-1/2 -translate-x-1/2 bottom-32 z-20 w-11 h-11 rounded-full liquid-glass flex items-center justify-center text-text-secondary pressable animate-fade-in shadow-lg"
          aria-label="Scroll to bottom"
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </button>
      )}

      {/* Footer disclaimer */}
      {messages.length > 0 && !isLoading && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary/40 font-mono">
            <img src="/tilde-logo.png" alt="" className="w-4 h-4 rounded opacity-50" />
            <span>tilde can make mistakes. Please double-check responses.</span>
          </div>
        </div>
      )}

        {/* Input - Always visible */}
        <InputBar
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          conversationId={conversationId || ''}
        />
      </div>
    </Page>
  )
}
