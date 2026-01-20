import { useState, useEffect } from 'react'
import { setHasSeenWelcome } from '@/storage/settings'
import { hapticImpact } from '@/lib/haptics'

interface WelcomeScreenProps {
  onComplete: () => void
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    // Auto-advance after 2.5 seconds if image is loaded
    if (imageLoaded) {
      const timer = setTimeout(() => {
        handleContinue()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [imageLoaded])

  const handleContinue = async () => {
    await hapticImpact('light')
    setFadeOut(true)
    
    setTimeout(async () => {
      await setHasSeenWelcome()
      onComplete()
    }, 500)
  }

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleContinue}
    >
      <img
        src="/welcome.png"
        alt="Welcome to tilde"
        className="w-full h-full object-cover"
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Tap to continue hint */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm animate-pulse">
          <span className="text-white/80 text-sm font-mono">Tap to continue</span>
        </div>
      </div>
    </div>
  )
}
