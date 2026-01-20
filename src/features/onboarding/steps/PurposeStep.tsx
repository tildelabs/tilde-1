import { hapticSelection } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface PurposeStepProps {
  selected: string[]
  onChange: (selected: string[]) => void
  onNext: () => void
  onBack: () => void
}

const PURPOSES = [
  { id: 'writing', label: 'Writing & editing', icon: '✍️' },
  { id: 'coding', label: 'Coding & technical help', icon: '💻' },
  { id: 'learning', label: 'Learning new things', icon: '📚' },
  { id: 'brainstorming', label: 'Brainstorming ideas', icon: '💡' },
  { id: 'work', label: 'Work tasks', icon: '💼' },
  { id: 'personal', label: 'Personal assistant', icon: '🏠' },
  { id: 'research', label: 'Research & analysis', icon: '🔍' },
  { id: 'creative', label: 'Creative projects', icon: '🎨' },
]

export function PurposeStep({ selected, onChange, onNext, onBack }: PurposeStepProps) {
  const togglePurpose = (id: string) => {
    hapticSelection()
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id))
    } else {
      onChange([...selected, id])
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
      <div className="flex-1 flex flex-col px-6 pt-6">
        <h1 className="text-3xl font-semibold text-text-primary mb-2 animate-fade-in">
          What will you use tilde for?
        </h1>
        <p className="text-text-secondary mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Select all that apply. This helps me assist you better.
        </p>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pb-4">
          {PURPOSES.map((purpose, index) => (
            <button
              key={purpose.id}
              onClick={() => togglePurpose(purpose.id)}
              className={cn(
                'flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 pressable text-left',
                'animate-fade-in',
                selected.includes(purpose.id)
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-white hover:border-accent/30'
              )}
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <span className="text-2xl mb-2">{purpose.icon}</span>
              <span className={cn(
                'text-sm font-medium leading-tight',
                selected.includes(purpose.id) ? 'text-accent' : 'text-text-primary'
              )}>
                {purpose.label}
              </span>
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
          {selected.length > 0 ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
