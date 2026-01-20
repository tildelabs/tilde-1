import { db, type Attachment } from './db'
import { generateId } from '@/lib/utils'

export async function saveAttachment(
  conversationId: string,
  messageIndex: number,
  file: File
): Promise<Attachment> {
  const id = generateId()

  let type: Attachment['type'] = 'file'
  if (file.type.startsWith('image/')) {
    type = 'image'
  } else if (file.type === 'application/pdf') {
    type = 'pdf'
  }

  // Generate thumbnail for images
  let thumbnail: Blob | undefined
  if (type === 'image') {
    thumbnail = await generateThumbnail(file)
  }

  const attachment: Attachment = {
    id,
    conversationId,
    messageIndex,
    type,
    mimeType: file.type,
    filename: file.name,
    blob: file,
    thumbnail,
    created: new Date(),
  }

  await db.attachments.add(attachment)
  return attachment
}

export async function getAttachment(id: string): Promise<Attachment | undefined> {
  return db.attachments.get(id)
}

export async function getConversationAttachments(conversationId: string): Promise<Attachment[]> {
  return db.attachments.where('conversationId').equals(conversationId).toArray()
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.attachments.delete(id)
}

async function generateThumbnail(file: File, maxSize = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create thumbnail'))
        },
        'image/jpeg',
        0.8
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function getAttachmentUrl(attachment: Attachment): string {
  return URL.createObjectURL(attachment.blob)
}

export function getThumbnailUrl(attachment: Attachment): string | null {
  if (!attachment.thumbnail) return null
  return URL.createObjectURL(attachment.thumbnail)
}

export async function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix to get just the base64
      const base64 = result.split(',')[1]
      resolve(base64 || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
