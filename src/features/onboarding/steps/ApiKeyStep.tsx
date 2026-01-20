import { useState, useRef, useEffect } from 'react'
import { validateApiKey } from '@/brain/claude'
import { hapticNotification, hapticImpact } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface ApiKeyStepProps {
  onComplete: (apiKey: string) => void
  onBack: () => void
  userName: string
}

export function ApiKeyStep({ onComplete, onBack, userName }: ApiKeyStepProps) {
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async () => {
    if (!apiKey.trim()) return

    setError('')
    setIsValidating(true)
    hapticImpact('light')

    const isValid = await validateApiKey(apiKey.trim())

    setIsValidating(false)

    if (isValid) {
      onComplete(apiKey.trim())
    } else {
      setError('This API key doesn\'t seem to work. Please check and try again.')
      hapticNotification('error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && apiKey.trim() && !isValidating) {
      handleSubmit()
    }
  }

  const displayName = userName || 'there'

  return (
    <div className="h-full flex flex-col safe-top safe-bottom">
      {/* Back button */}
      <div className="flex-shrink-0 pt-12 px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-accent font-medium pressable"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-6">
        <h1 className="text-3xl font-semibold text-text-primary mb-2 animate-fade-in">
          Almost there, {displayName}!
        </h1>
        <p className="text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Add your Claude API key to start chatting. Your key stays on your device.
        </p>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* API Key Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="sk-ant-api..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                'w-full px-4 py-4 pr-12 bg-surface border-2 rounded-2xl',
                'text-text-primary font-mono text-sm',
                'placeholder:text-text-secondary/40',
                'outline-none transition-all duration-200',
                error
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-border focus:border-accent'
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text-secondary pressable"
            >
              {showKey ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm animate-fade-in">
              {error}
            </p>
          )}

          {/* Help link */}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-accent text-sm font-medium pressable"
          >
            Get your API key from Anthropic
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>

        {/* Info card */}
        <div className="mt-8 p-4 bg-surface rounded-2xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-text-primary mb-1">Your key is secure</h3>
              <p className="text-sm text-text-secondary">
                Your API key is stored locally on your device and never sent to our servers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex-shrink-0 px-6 pb-8">
        <button
          onClick={handleSubmit}
          disabled={!apiKey.trim() || isValidating}
          className={cn(
            'w-full py-4 rounded-2xl text-lg font-medium transition-all duration-300 pressable',
            apiKey.trim() && !isValidating
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'bg-surface text-text-secondary/50'
          )}
        >
          {isValidating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Validating...
            </span>
          ) : (
            'Start using tilde'
          )}
        </button>
      </div>
    </div>
  )
}
