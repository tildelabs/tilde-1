import { useState, useEffect } from 'react'
import { Page, f7 } from 'framework7-react'
import { getAllConversations, deleteConversation } from '@/storage/conversations'
import type { Conversation } from '@/storage/db'
import { formatDate } from '@/lib/utils'
import { hapticImpact, hapticSelection } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  f7router?: any
}

export function ConversationList({ f7router }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadConversations()
  }, [])

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function loadConversations() {
    const convos = await getAllConversations()
    setConversations(convos)
    setLoading(false)
  }

  async function handleBack() {
    await hapticImpact('light')
    f7router?.back() || f7.views.main.router.navigate('/')
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await hapticImpact('medium')
    await deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  async function handleConversationClick(id: string) {
    await hapticSelection()
    f7.views.main.router.navigate(`/chat/${id}`, {
      reloadCurrent: true,
      ignoreCache: true,
    })
  }

  async function handleNewChat() {
    await hapticImpact('light')
    f7.views.main.router.navigate('/', {
      reloadCurrent: true,
      ignoreCache: true,
    })
  }

  return (
    <Page className="bg-gradient-to-b from-white via-white to-gray-50/50">
      {/* Floating Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-20 pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <div className="flex items-center px-4 pt-2 pb-2">
          <button
            onClick={handleBack}
            className="pointer-events-auto w-11 h-11 rounded-full floating-glass-btn flex items-center justify-center text-accent"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 flex justify-center pointer-events-auto">
            <div className="px-5 py-2 rounded-full floating-glass-btn">
              <h1 className="font-semibold font-mono text-text-primary text-sm">
                History
              </h1>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="pointer-events-auto w-11 h-11 rounded-full floating-glass-btn flex items-center justify-center text-accent"
            aria-label="New chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Top blur gradient */}
      <div 
        className="fixed top-0 left-0 right-0 h-28 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 60%, rgba(255,255,255,0) 100%)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      />

      {/* Content */}
      <div 
        className="h-full overflow-y-auto px-4 pb-4"
        style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 12px) + 70px)' }}
      >
        {/* Search Bar */}
        {conversations.length > 0 && (
          <div className="mb-4 animate-fade-in">
            <div className="liquid-glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <svg className="w-5 h-5 text-text-secondary/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 font-mono text-text-primary text-[15px] placeholder:text-text-secondary/40 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-text-secondary/50 pressable"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl liquid-glass flex items-center justify-center mb-6">
              <img src="/tilde-logo.png" alt="tilde" className="w-12 h-12 rounded-xl opacity-60" />
            </div>
            <h2 className="text-lg font-semibold mb-2 font-mono text-text-primary">No history yet</h2>
            <p className="text-text-secondary/70 font-mono text-sm">
              Your conversations will appear here
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl liquid-glass flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 font-mono text-text-primary">No results</h2>
            <p className="text-text-secondary/70 font-mono text-sm">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation, index) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={cn(
                  'w-full text-left rounded-2xl liquid-glass-subtle pressable animate-float-up',
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium font-mono text-text-primary truncate text-[15px]">
                      {conversation.title}
                    </h3>
                    <p className="text-sm text-text-secondary/60 mt-1 font-mono">
                      {formatDate(conversation.updated)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-white/50 flex items-center justify-center text-text-secondary/40 hover:text-red-500 hover:bg-red-50 transition-all pressable"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}
