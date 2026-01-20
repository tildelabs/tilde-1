export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachmentIds?: string[]
}

interface Frontmatter {
  id: string
  title: string
  created: string
  updated: string
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { frontmatter: null, body: content }

  const [, yaml, body] = match
  const frontmatter: Record<string, string> = {}

  yaml?.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim()
      frontmatter[key] = value
    }
  })

  return {
    frontmatter: frontmatter as unknown as Frontmatter,
    body: body || '',
  }
}

export function parseConversationMarkdown(markdown: string): Message[] {
  const { body } = parseFrontmatter(markdown)
  const messages: Message[] = []

  // Split by message headers (## user or ## assistant)
  const messageBlocks = body.split(/^## (user|assistant) — /m).filter(Boolean)

  for (let i = 0; i < messageBlocks.length; i += 2) {
    const role = messageBlocks[i] as 'user' | 'assistant'
    const block = messageBlocks[i + 1]
    if (!block) continue

    // First line is timestamp, rest is content
    const lines = block.split('\n')
    const timestampLine = lines[0] || ''
    const content = lines.slice(1).join('\n').trim()

    // Parse timestamp (e.g., "10:30 AM")
    let timestamp = new Date()
    try {
      const timeMatch = timestampLine.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (timeMatch) {
        const [, hours, minutes, period] = timeMatch
        timestamp = new Date()
        let h = parseInt(hours || '0', 10)
        if (period?.toUpperCase() === 'PM' && h !== 12) h += 12
        if (period?.toUpperCase() === 'AM' && h === 12) h = 0
        timestamp.setHours(h, parseInt(minutes || '0', 10), 0, 0)
      }
    } catch {
      // Use current time if parsing fails
    }

    // Extract attachment references
    const attachmentIds: string[] = []
    const attachmentMatches = content.matchAll(/!\[.*?\]\(attachments\/(.*?)\)/g)
    for (const match of attachmentMatches) {
      if (match[1]) attachmentIds.push(match[1])
    }

    messages.push({
      role,
      content: content.replace(/!\[.*?\]\(attachments\/.*?\)\n*/g, '').trim(),
      timestamp,
      attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
    })
  }

  return messages
}

export function serializeConversation(
  id: string,
  title: string,
  messages: Message[]
): string {
  const now = new Date().toISOString()

  let markdown = `---
id: ${id}
title: ${title}
created: ${now}
updated: ${now}
---

`

  for (const message of messages) {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(message.timestamp)

    markdown += `## ${message.role} — ${time}\n\n`

    // Add attachment references
    if (message.attachmentIds?.length) {
      for (const attachmentId of message.attachmentIds) {
        markdown += `![attachment](attachments/${attachmentId})\n\n`
      }
    }

    markdown += `${message.content}\n\n`
  }

  return markdown
}
