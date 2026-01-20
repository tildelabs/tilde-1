import { useState, useCallback } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { NameStep } from './steps/NameStep'
import { PurposeStep } from './steps/PurposeStep'
import { StyleStep } from './steps/StyleStep'
import { ApiKeyStep } from './steps/ApiKeyStep'
import { updateProfile } from '@/storage/profile'
import { setApiKey } from '@/storage/settings'
import { hapticImpact, hapticNotification } from '@/lib/haptics'

export interface OnboardingData {
  name: string
  purposes: string[]
  style: string
}

interface OnboardingProps {
  onComplete: () => void
}

type Step = 'welcome' | 'name' | 'purpose' | 'style' | 'apikey'

const STEPS: Step[] = ['welcome', 'name', 'purpose', 'style', 'apikey']

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [data, setData] = useState<OnboardingData>({
    name: '',
    purposes: [],
    style: 'balanced',
  })

  const currentIndex = STEPS.indexOf(currentStep)

  const goNext = useCallback(() => {
    hapticImpact('light')
    setDirection('forward')
    const nextIndex = currentIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]!)
    }
  }, [currentIndex])

  const goBack = useCallback(() => {
    hapticImpact('light')
    setDirection('back')
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]!)
    }
  }, [currentIndex])

  const handleComplete = useCallback(async (apiKey: string) => {
    // Build context from onboarding data
    const contextParts: string[] = []

    if (data.purposes.length > 0) {
      contextParts.push(`Uses tilde for: ${data.purposes.join(', ')}`)
    }

    if (data.style) {
      const styleDescriptions: Record<string, string> = {
        concise: 'Prefers brief, to-the-point responses',
        balanced: 'Prefers balanced responses with appropriate detail',
        detailed: 'Prefers thorough, detailed explanations',
      }
      contextParts.push(styleDescriptions[data.style] || '')
    }

    await updateProfile({
      name: data.name,
      context: contextParts.filter(Boolean).join('\n'),
    })

    await setApiKey(apiKey)

    hapticNotification('success')
    onComplete()
  }, [data, onComplete])

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <div className="h-full w-full bg-white overflow-hidden">
      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 safe-top z-20">
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ease-out ${
                index <= currentIndex ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="h-full relative">
        <StepContainer isActive={currentStep === 'welcome'} direction={direction}>
          <WelcomeStep onNext={goNext} />
        </StepContainer>

        <StepContainer isActive={currentStep === 'name'} direction={direction}>
          <NameStep
            value={data.name}
            onChange={(name) => updateData({ name })}
            onNext={goNext}
            onBack={goBack}
          />
        </StepContainer>

        <StepContainer isActive={currentStep === 'purpose'} direction={direction}>
          <PurposeStep
            selected={data.purposes}
            onChange={(purposes) => updateData({ purposes })}
            onNext={goNext}
            onBack={goBack}
          />
        </StepContainer>

        <StepContainer isActive={currentStep === 'style'} direction={direction}>
          <StyleStep
            selected={data.style}
            onChange={(style) => updateData({ style })}
            onNext={goNext}
            onBack={goBack}
          />
        </StepContainer>

        <StepContainer isActive={currentStep === 'apikey'} direction={direction}>
          <ApiKeyStep
            onComplete={handleComplete}
            onBack={goBack}
            userName={data.name}
          />
        </StepContainer>
      </div>
    </div>
  )
}

interface StepContainerProps {
  isActive: boolean
  direction: 'forward' | 'back'
  children: React.ReactNode
}

function StepContainer({ isActive, direction, children }: StepContainerProps) {
  if (!isActive) return null

  return (
    <div
      className={`absolute inset-0 ${
        direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'
      }`}
    >
      {children}
    </div>
  )
}
