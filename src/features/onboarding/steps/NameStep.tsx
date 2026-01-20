import { useEffect, useRef, useState } from 'react'
import { hapticSelection } from '@/lib/haptics'

interface NameStepProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

export function NameStep({ value, onChange, onNext, onBack }: NameStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onNext()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (e.target.value.length === 1) {
      hapticSelection()
    }
  }

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
      <div className="flex-1 flex flex-col justify-center px-8">
        <h1 className="text-3xl font-semibold text-text-primary mb-2 animate-fade-in">
          What's your name?
        </h1>
        <p className="text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          This helps me personalize our conversations.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            className={`relative animate-fade-in transition-all duration-300 ${
              isFocused ? 'transform scale-[1.02]' : ''
            }`}
            style={{ animationDelay: '0.2s' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter your name"
              autoComplete="given-name"
              autoCapitalize="words"
              className={`w-full text-2xl font-medium text-text-primary bg-transparent
                border-b-2 pb-3 pt-2 outline-none transition-all duration-300
                placeholder:text-text-secondary/40
                ${isFocused ? 'border-accent' : 'border-border'}`}
            />
            <div
              className={`absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-300 ease-out
                ${isFocused ? 'w-full' : 'w-0'}`}
            />
          </div>
        </form>
      </div>

      {/* Continue button */}
      <div className="flex-shrink-0 px-8 pb-8">
        <button
          onClick={onNext}
          disabled={!value.trim()}
          className={`w-full py-4 rounded-2xl text-lg font-medium transition-all duration-300 pressable
            ${value.trim()
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'bg-surface text-text-secondary/50'
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
