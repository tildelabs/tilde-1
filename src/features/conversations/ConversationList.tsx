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

  useEffect(() => {
    loadConversations()
  }, [])

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
    f7.views.main.router.navigate(`/chat/${id}`)
  }

  return (
    <Page className="bg-white">
      {/* Header */}
      <header className="flex-shrink-0 safe-top bg-white/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-accent pressable -ml-2"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center font-semibold font-mono text-text-primary">
            History
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="h-full overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
            <img src="/tilde-logo.png" alt="tilde" className="w-16 h-16 rounded-2xl mb-4 opacity-50" />
            <h2 className="text-lg font-semibold mb-2 font-mono">No history yet</h2>
            <p className="text-text-secondary font-mono">
              Your conversations will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation, index) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={cn(
                  'w-full text-left px-4 py-4 active:bg-surface transition-colors duration-100 animate-slide-up',
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium font-mono text-text-primary truncate">
                      {conversation.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-0.5 font-mono">
                      {formatDate(conversation.updated)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-text-secondary/50 hover:text-red-500 transition-colors pressable"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
