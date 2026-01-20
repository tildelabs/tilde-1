import { useEffect, useState } from 'react'
import { hapticImpact } from '@/lib/haptics'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const [showContent, setShowContent] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowContent(true), 200)
    const timer2 = setTimeout(() => setShowButton(true), 800)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const handleStart = () => {
    hapticImpact('medium')
    onNext()
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 safe-top safe-bottom">
      {/* Logo */}
      <div
        className={`mb-8 transition-all duration-700 ease-out ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
          <span className="text-5xl text-white font-light">~</span>
        </div>
      </div>

      {/* Title */}
      <h1
        className={`text-4xl font-semibold text-text-primary mb-3 transition-all duration-700 delay-100 ease-out ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        tilde
      </h1>

      {/* Subtitle */}
      <p
        className={`text-lg text-text-secondary text-center max-w-xs transition-all duration-700 delay-200 ease-out ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        Your personal AI assistant, designed to help with whatever you need.
      </p>

      {/* CTA Button */}
      <button
        onClick={handleStart}
        className={`mt-12 px-8 py-4 bg-accent text-white text-lg font-medium rounded-2xl
          transition-all duration-500 ease-out pressable
          hover:bg-accent-hover active:scale-[0.97]
          ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        Get Started
      </button>

      {/* Footer */}
      <p
        className={`absolute bottom-8 text-sm text-text-secondary/60 text-center px-8 safe-bottom
          transition-all duration-700 delay-500 ease-out ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Your data stays on your device
      </p>
    </div>
  )
}
