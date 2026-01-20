import { useState, useEffect, useRef } from 'react'
import { f7 } from 'framework7-react'
import { getAllConversations, deleteConversation } from '@/storage/conversations'
import type { Conversation } from '@/storage/db'
import { formatDate } from '@/lib/utils'
import { hapticImpact, hapticSelection } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onOpenSettings: () => void
  currentConversationId?: string | null
}

interface ContextMenuState {
  isOpen: boolean
  conversationId: string | null
  x: number
  y: number
}

export function Sidebar({ isOpen, onClose, onNewChat, onSelectConversation, onOpenSettings, currentConversationId }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    conversationId: null,
    x: 0,
    y: 0
  })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchCurrentX = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  // Close context menu when clicking outside
  useEffect(() => {
    if (contextMenu.isOpen) {
      const handleClick = () => setContextMenu(prev => ({ ...prev, isOpen: false }))
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu.isOpen])

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX || 0
    touchCurrentX.current = touchStartX.current
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    touchCurrentX.current = e.touches[0]?.clientX || 0
    
    const diff = touchStartX.current - touchCurrentX.current
    if (diff > 0 && sidebarRef.current) {
      // Dragging left (closing)
      sidebarRef.current.style.transform = `translateX(-${Math.min(diff, 300)}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    
    const diff = touchStartX.current - touchCurrentX.current
    if (diff > 80) {
      // Swipe threshold reached, close sidebar
      onClose()
    }
    
    // Reset transform
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = ''
    }
  }

  async function loadConversations() {
    setLoading(true)
    const convos = await getAllConversations()
    // Only show last 10 conversations in sidebar
    setConversations(convos.slice(0, 10))
    setLoading(false)
  }

  async function handleAllChats() {
    await hapticImpact('light')
    onClose()
    f7.views.main.router.navigate('/history')
  }

  async function handleDelete(id: string) {
    await hapticImpact('medium')
    await deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    setContextMenu({ isOpen: false, conversationId: null, x: 0, y: 0 })
  }

  async function handleConversationClick(id: string) {
    if (contextMenu.isOpen) {
      setContextMenu({ isOpen: false, conversationId: null, x: 0, y: 0 })
      return
    }
    await hapticSelection()
    onSelectConversation(id)
    onClose()
  }

  function handleLongPressStart(id: string, e: React.TouchEvent | React.MouseEvent) {
    const touch = 'touches' in e ? e.touches[0] : e
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    
    if (!touch) return
    
    const clientX = touch.clientX
    const clientY = touch.clientY
    
    longPressTimer.current = setTimeout(async () => {
      await hapticImpact('medium')
      setContextMenu({
        isOpen: true,
        conversationId: id,
        x: Math.min(clientX, rect.right - 160),
        y: clientY
      })
    }, 500)
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleLongPressMove() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  async function handleNewChat() {
    await hapticImpact('medium')
    onNewChat()
    onClose()
  }

  async function handleSettings() {
    await hapticImpact('light')
    onClose()
    onOpenSettings()
  }

  return (
    <div
      ref={sidebarRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'fixed top-0 left-0 bottom-0 z-30 w-[90%] max-w-[360px]',
        'bg-white/80 backdrop-blur-2xl',
        'border-r border-white/40',
        'shadow-2xl shadow-black/10',
        'transform transition-transform duration-300 ease-ios',
        'flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(249,249,249,0.98) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-2 pb-3 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-text-primary" style={{ fontFamily: 'Instrument Serif, serif' }}>tilde</h1>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-surface/80 flex items-center justify-center text-text-secondary pressable"
          aria-label="Close menu"
        >
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.25 9.75L13 12L15.25 14.25" />
            <path d="M3.75 5.75C3.75 4.64543 4.64543 3.75 5.75 3.75H18.25C19.3546 3.75 20.25 4.64543 20.25 5.75V18.25C20.25 19.3546 19.3546 20.25 18.25 20.25H5.75C4.64543 20.25 3.75 19.3546 3.75 18.25V5.75Z" />
            <path d="M8.25 3.75V20.25" />
          </svg>
        </button>
      </div>

      {/* Recents Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3">
          <h3 className="text-sm font-semibold text-text-secondary/60 uppercase tracking-wider font-mono">
            Recents
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-text-secondary/50 text-sm font-mono">No conversations yet</p>
          </div>
        ) : (
          <div className="px-3 space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                onTouchStart={(e) => handleLongPressStart(conversation.id, e)}
                onTouchEnd={handleLongPressEnd}
                onTouchMove={handleLongPressMove}
                onMouseDown={(e) => handleLongPressStart(conversation.id, e)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onContextMenu={(e) => {
                  e.preventDefault()
                  hapticImpact('medium')
                  setContextMenu({
                    isOpen: true,
                    conversationId: conversation.id,
                    x: e.clientX,
                    y: e.clientY
                  })
                }}
                className={cn(
                  'w-full text-left px-4 py-4 rounded-xl transition-all pressable select-none',
                  currentConversationId === conversation.id
                    ? 'bg-accent/10 border border-accent/20'
                    : 'hover:bg-surface/80 active:bg-surface'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-base font-mono truncate',
                    currentConversationId === conversation.id
                      ? 'text-accent font-medium'
                      : 'text-text-primary'
                  )}>
                    {conversation.title}
                  </p>
                  <p className="text-sm text-text-secondary/50 mt-1 font-mono">
                    {formatDate(conversation.updated)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* All Chats Link */}
      {conversations.length > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={handleAllChats}
            className="w-full flex items-center justify-center gap-2 py-3 text-accent font-mono text-base pressable"
          >
            <span>All chats</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom Section */}
      <div className="flex-shrink-0 border-t border-border/30 p-4 space-y-3">
        {/* Settings */}
        <button
          onClick={handleSettings}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-surface/80 transition-colors pressable"
        >
          <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium font-mono text-base text-text-primary">Settings</span>
        </button>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl liquid-glass-accent text-white pressable"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="font-semibold font-mono text-base">New chat</span>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.conversationId && (
        <div
          className="fixed z-50 animate-scale-in"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transformOrigin: 'top left'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="liquid-glass rounded-2xl overflow-hidden shadow-xl min-w-[180px]">
            <button
              onClick={() => handleDelete(contextMenu.conversationId!)}
              className="w-full flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 transition-colors pressable"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span className="font-mono text-base font-medium">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
