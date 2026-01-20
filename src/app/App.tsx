import { useEffect, useState } from 'react'
import { App, View, f7ready } from 'framework7-react'
import { ConversationList } from '@/features/conversations/ConversationList'
import { ChatView } from '@/features/chat/ChatView'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { hasApiKey, hasSeenWelcome } from '@/storage/settings'

// Framework7 Routes - Chat is main screen, history is secondary
const routes = [
  {
    path: '/',
    component: ChatView,
  },
  {
    path: '/chat/:id',
    component: ChatView,
  },
  {
    path: '/history',
    component: ConversationList,
  },
]

// Framework7 App params
const f7params = {
  name: 'tilde',
  theme: 'ios',
  routes,
  darkMode: false,
  colors: {
    primary: '#E85B2B',
  },
  touch: {
    tapHold: true,
    tapHoldDelay: 500,
  },
  view: {
    iosDynamicNavbar: true,
    xhrCache: false,
  },
}

export default function AppRoot() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkState() {
      const seenWelcome = await hasSeenWelcome()
      const hasKey = await hasApiKey()
      
      setShowWelcome(!seenWelcome)
      setNeedsOnboarding(!hasKey)
    }
    checkState()
  }, [])

  useEffect(() => {
    f7ready(() => {
      // Framework7 is ready
    })
  }, [])

  // Show loading spinner while checking
  if (showWelcome === null || needsOnboarding === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <img
          src="/tilde-logo.png"
          alt="tilde"
          className="w-24 h-24 rounded-[28px] animate-pulse"
        />
      </div>
    )
  }

  // Show welcome screen for first-time users
  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />
  }

  // Show onboarding for users without API key
  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />
  }

  return (
    <App {...f7params}>
      <View
        main
        url="/"
        iosSwipeBack={true}
        animate={true}
        browserHistory={false}
        className="safe-areas"
      />
    </App>
  )
}
