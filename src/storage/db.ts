import Dexie, { type EntityTable } from 'dexie'

export interface Conversation {
  id: string
  title: string
  created: Date
  updated: Date
  content: string // Markdown content
}

export interface Attachment {
  id: string
  conversationId: string
  messageIndex: number
  type: 'image' | 'pdf' | 'file'
  mimeType: string
  filename: string
  blob: Blob
  thumbnail?: Blob
  created: Date
}

export interface Profile {
  id: 'profile'
  name: string
  context: string // Additional context about the user
  updated: Date
}

export interface Settings {
  id: 'settings'
  apiKey: string
  theme: 'light' | 'dark' | 'system'
  haptics: boolean
  appIcon: string
  hasSeenWelcome: boolean
  updated: Date
}

const db = new Dexie('tilde') as Dexie & {
  conversations: EntityTable<Conversation, 'id'>
  attachments: EntityTable<Attachment, 'id'>
  profile: EntityTable<Profile, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  conversations: 'id, title, created, updated',
  attachments: 'id, conversationId, messageIndex, created',
  profile: 'id',
  settings: 'id',
})

export { db }
