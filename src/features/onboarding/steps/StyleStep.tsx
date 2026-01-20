import { hapticImpact } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface StyleStepProps {
  selected: string
  onChange: (style: string) => void
  onNext: () => void
  onBack: () => void
}

const STYLES = [
  {
    id: 'concise',
    title: 'Concise',
    description: 'Brief and to the point. Just the essentials.',
    example: '"The answer is 42."',
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Clear explanations with appropriate detail.',
    example: '"The answer is 42. Here\'s why..."',
  },
  {
    id: 'detailed',
    title: 'Detailed',
    description: 'Thorough explanations with context and examples.',
    example: '"Let me walk you through this step by step..."',
  },
]

export function StyleStep({ selected, onChange, onNext, onBack }: StyleStepProps) {
  const handleSelect = (id: string) => {
    hapticImpact('light')
    onChange(id)
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
      <div className="flex-1 flex flex-col px-6 pt-6">
        <h1 className="text-3xl font-semibold text-text-primary mb-2 animate-fade-in">
          How should I respond?
        </h1>
        <p className="text-text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Choose your preferred response style.
        </p>

        <div className="space-y-3">
          {STYLES.map((style, index) => (
            <button
              key={style.id}
              onClick={() => handleSelect(style.id)}
              className={cn(
                'w-full p-5 rounded-2xl border-2 transition-all duration-200 pressable text-left',
                'animate-fade-in',
                selected === style.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-white hover:border-accent/30'
              )}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={cn(
                  'text-lg font-semibold',
                  selected === style.id ? 'text-accent' : 'text-text-primary'
                )}>
                  {style.title}
                </h3>
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  selected === style.id
                    ? 'border-accent bg-accent'
                    : 'border-border'
                )}>
                  {selected === style.id && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                {style.description}
              </p>
              <p className="text-sm text-text-secondary/70 italic">
                {style.example}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="flex-shrink-0 px-6 pb-8">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl text-lg font-medium bg-accent text-white hover:bg-accent-hover transition-all duration-300 pressable"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
