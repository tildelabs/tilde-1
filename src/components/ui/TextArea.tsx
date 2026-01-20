import { forwardRef, type TextareaHTMLAttributes, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  autoResize?: boolean
  maxHeight?: number
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, autoResize = false, maxHeight = 200, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
      }
    }, [props.value, autoResize, maxHeight, textareaRef])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        const textarea = e.target
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
      }
      onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          className={cn(
            'w-full px-4 py-3 bg-surface border border-border rounded-xl',
            'text-text-primary placeholder:text-text-secondary/50',
            'outline-none transition-all duration-200 resize-none',
            'focus:border-accent focus:ring-2 focus:ring-accent/10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
