import { getApiKey } from '@/storage/settings'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContent[]
}

export interface ClaudeContent {
  type: 'text' | 'image'
  text?: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
}

interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: (fullText: string) => void
  onError: (error: Error) => void
}

const API_URL = 'https://api.anthropic.com/v1/messages'

export async function streamMessage(
  messages: ClaudeMessage[],
  systemPrompt: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = await getApiKey()

  if (!apiKey) {
    callbacks.onError(new Error('No API key configured'))
    return
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API error: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        callbacks.onComplete(fullText)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            callbacks.onComplete(fullText)
            return
          }

          try {
            const event = JSON.parse(data)

            if (event.type === 'content_block_delta' && event.delta?.text) {
              const token = event.delta.text
              fullText += token
              callbacks.onToken(token)
            }

            if (event.type === 'message_stop') {
              callbacks.onComplete(fullText)
              return
            }

            if (event.type === 'error') {
              throw new Error(event.error?.message || 'Stream error')
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Ignore JSON parse errors for incomplete chunks
              continue
            }
            throw e
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was aborted, don't treat as error
      return
    }
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error'))
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    })

    return response.ok
  } catch {
    return false
  }
}

export async function generateChatTitle(userMessage: string, assistantMessage: string): Promise<string> {
  const apiKey = await getApiKey()

  if (!apiKey) {
    // Fallback to first few words of user message
    return userMessage.slice(0, 40).trim() + (userMessage.length > 40 ? '...' : '')
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 30,
        messages: [
          {
            role: 'user',
            content: `Generate a very short (2-5 words) title for a conversation that starts with this exchange. Return ONLY the title, no quotes or punctuation at the end.

User: ${userMessage.slice(0, 200)}
Assistant: ${assistantMessage.slice(0, 200)}`
          }
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate title')
    }

    const data = await response.json()
    const title = data.content?.[0]?.text?.trim() || ''
    
    // Clean up and limit length
    return title.slice(0, 50) || userMessage.slice(0, 40).trim()
  } catch {
    // Fallback to first few words of user message
    return userMessage.slice(0, 40).trim() + (userMessage.length > 40 ? '...' : '')
  }
}
