import { db, type Conversation } from './db'
import { generateId } from '@/lib/utils'
import { parseConversationMarkdown, serializeConversation, type Message } from './markdown'

export async function getAllConversations(): Promise<Conversation[]> {
  return db.conversations.orderBy('updated').reverse().toArray()
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return db.conversations.get(id)
}

export async function createConversation(title?: string): Promise<Conversation> {
  const id = generateId()
  const now = new Date()

  const conversation: Conversation = {
    id,
    title: title || 'New conversation',
    created: now,
    updated: now,
    content: serializeConversation(id, title || 'New conversation', []),
  }

  await db.conversations.add(conversation)
  return conversation
}

export async function updateConversation(
  id: string,
  updates: Partial<Omit<Conversation, 'id' | 'created'>>
): Promise<void> {
  await db.conversations.update(id, {
    ...updates,
    updated: new Date(),
  })
}

export async function deleteConversation(id: string): Promise<void> {
  await db.transaction('rw', [db.conversations, db.attachments], async () => {
    await db.conversations.delete(id)
    await db.attachments.where('conversationId').equals(id).delete()
  })
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const conversation = await getConversation(conversationId)
  if (!conversation) return []
  return parseConversationMarkdown(conversation.content)
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  attachmentIds?: string[]
): Promise<void> {
  const conversation = await getConversation(conversationId)
  if (!conversation) return

  const messages = parseConversationMarkdown(conversation.content)
  messages.push({
    role,
    content,
    timestamp: new Date(),
    attachmentIds,
  })

  // Update title from first user message if still default
  let title = conversation.title
  if (title === 'New conversation' && role === 'user') {
    title = content.slice(0, 50).trim() || 'New conversation'
    if (content.length > 50) title += '...'
  }

  const newContent = serializeConversation(conversationId, title, messages)
  await updateConversation(conversationId, { content: newContent, title })
}

export async function updateLastMessage(
  conversationId: string,
  content: string
): Promise<void> {
  const conversation = await getConversation(conversationId)
  if (!conversation) return

  const messages = parseConversationMarkdown(conversation.content)
  if (messages.length === 0) return

  const lastMessage = messages[messages.length - 1]
  if (lastMessage) {
    lastMessage.content = content
  }

  const newContent = serializeConversation(conversationId, conversation.title, messages)
  await updateConversation(conversationId, { content: newContent })
}
