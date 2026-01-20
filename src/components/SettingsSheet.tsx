import { useState, useEffect, useRef } from 'react'
import { getSettings, updateSettings, setAppIcon } from '@/storage/settings'
import { getProfile, updateProfile } from '@/storage/profile'
import { validateApiKey } from '@/brain/claude'
import { hapticNotification, hapticImpact, hapticSelection } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface SettingsSheetProps {
  isOpen: boolean
  onClose: () => void
}

type AppearanceMode = 'system' | 'light' | 'dark'
type SubPage = 'main' | 'profile' | 'apikey' | 'appicon'

const APP_ICONS = [
  { id: 'tilde-logo.png', name: 'Default' },
  { id: 'tilde-logo2.png', name: 'Minimal' },
  { id: 'tilde-logo3.png', name: 'Light' },
  { id: 'tilde-logo4.png', name: 'Gradient' },
  { id: 'tilde-logo5.png', name: 'Dark' },
]

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const [apiKey, setApiKey] = useState('')
  const [originalApiKey, setOriginalApiKey] = useState('')
  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [appearance, setAppearance] = useState<AppearanceMode>('system')
  const [selectedIcon, setSelectedIcon] = useState('tilde-logo.png')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [subPage, setSubPage] = useState<SubPage>('main')
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchCurrentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
      setSubPage('main')
    }
  }, [isOpen])

  async function loadSettings() {
    const settings = await getSettings()
    const profile = await getProfile()

    setApiKey(settings.apiKey)
    setOriginalApiKey(settings.apiKey)
    setName(profile.name)
    setContext(profile.context)
    setSelectedIcon(settings.appIcon || 'tilde-logo.png')
  }

  const handleSaveProfile = async () => {
    await updateProfile({ name, context })
    hapticNotification('success')
    setSubPage('main')
  }

  const handleSaveApiKey = async () => {
    setError('')

    if (apiKey && apiKey !== originalApiKey) {
      setValidating(true)
      const isValid = await validateApiKey(apiKey)
      setValidating(false)

      if (!isValid) {
        setError('Invalid API key')
        hapticNotification('error')
        return
      }
    }

    await updateSettings({ apiKey })
    setOriginalApiKey(apiKey)
    hapticNotification('success')
    setSubPage('main')
  }

  const handleClose = async () => {
    await hapticImpact('light')
    onClose()
  }

  const handleBack = async () => {
    await hapticImpact('light')
    setSubPage('main')
    setError('')
  }

  const handleAppearanceChange = async (mode: AppearanceMode) => {
    await hapticSelection()
    setAppearance(mode)
    // TODO: Implement actual theme switching
  }

  const handleSaveAppIcon = async () => {
    await setAppIcon(selectedIcon)
    hapticNotification('success')
    setSubPage('main')
  }

  const handleIconSelect = async (iconId: string) => {
    await hapticSelection()
    setSelectedIcon(iconId)
  }

  const navigateTo = async (page: SubPage) => {
    await hapticImpact('light')
    setSubPage(page)
  }

  // Handle drag to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY || 0
    touchCurrentY.current = touchStartY.current
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    touchCurrentY.current = e.touches[0]?.clientY || 0
    
    const diff = touchCurrentY.current - touchStartY.current
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${Math.min(diff, 400)}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    
    const diff = touchCurrentY.current - touchStartY.current
    if (diff > 100) {
      onClose()
    }
    
    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
  }

  const getMaskedKey = () => {
    if (!apiKey) return 'Not configured'
    return apiKey.slice(0, 7) + '••••••••' + apiKey.slice(-4)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 animate-fade-in"
        style={{ zIndex: 9998 }}
        onClick={handleClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed left-0 right-0 bottom-0',
          'bg-[#f2f2f7] rounded-t-[28px]',
          'shadow-2xl shadow-black/20',
          'transform transition-transform duration-300 ease-ios',
          'max-h-[90vh] overflow-hidden flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ 
          zIndex: 9999,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-400/50" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          {subPage !== 'main' ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-accent pressable py-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="font-mono text-base">Back</span>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="text-accent font-mono text-base pressable py-2"
            >
              Done
            </button>
          )}
          <h1 className="text-lg font-semibold text-text-primary absolute left-1/2 -translate-x-1/2">
            {subPage === 'main' ? 'Settings' : subPage === 'profile' ? 'Profile' : subPage === 'apikey' ? 'API Key' : 'App Icon'}
          </h1>
          {subPage !== 'main' ? (
            <button
              onClick={subPage === 'profile' ? handleSaveProfile : subPage === 'apikey' ? handleSaveApiKey : handleSaveAppIcon}
              disabled={validating}
              className="text-accent font-semibold font-mono text-base pressable py-2 disabled:opacity-50"
            >
              {validating ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {subPage === 'main' && (
            <div className="px-4 pb-8 space-y-6">
              {/* Profile Section */}
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  Profile
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <button
                    onClick={() => navigateTo('profile')}
                    className="w-full flex items-center justify-between px-4 py-4 pressable"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <span className="text-base text-text-primary">{name || 'Add your name'}</span>
                    </div>
                    <svg className="w-5 h-5 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Appearance Section */}
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  Appearance
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                      </div>
                      <span className="text-base text-text-primary">Theme</span>
                    </div>
                    <div className="flex bg-surface rounded-lg p-1">
                      {(['system', 'light', 'dark'] as AppearanceMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleAppearanceChange(mode)}
                          className={cn(
                            'px-4 py-2 rounded-md text-sm font-medium transition-all capitalize',
                            appearance === mode
                              ? 'bg-white text-text-primary shadow-sm'
                              : 'text-text-secondary'
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* App Icon */}
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  App Icon
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <button
                    onClick={() => navigateTo('appicon')}
                    className="w-full flex items-center justify-between px-4 py-4 pressable"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={`/${selectedIcon}`} 
                        alt="Current icon" 
                        className="w-10 h-10 rounded-xl"
                      />
                      <span className="text-base text-text-primary">Change App Icon</span>
                    </div>
                    <svg className="w-5 h-5 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </section>

              {/* API Configuration */}
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  API Configuration
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <button
                    onClick={() => navigateTo('apikey')}
                    className="w-full flex items-center justify-between px-4 py-4 pressable"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="text-base text-text-primary block">Anthropic API Key</span>
                        <span className={cn(
                          "text-sm font-mono",
                          apiKey ? "text-green-600" : "text-text-secondary/50"
                        )}>
                          {apiKey ? getMaskedKey() : 'Not configured'}
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Data & Privacy */}
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  Data & Privacy
                </h3>
                <div className="bg-white rounded-xl overflow-hidden divide-y divide-border/30">
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-base text-text-primary block">Local Storage</span>
                      <span className="text-sm text-text-secondary/60">All data stays on device</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-base text-text-primary block">Direct API</span>
                      <span className="text-sm text-text-secondary/60">Messages go straight to Anthropic</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* About */}
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  About
                </h3>
                <div className="bg-white rounded-xl overflow-hidden divide-y divide-border/30">
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-base text-text-primary">Version</span>
                    <span className="text-base text-text-secondary/60">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-base text-text-primary">Model</span>
                    <span className="text-base text-text-secondary/60">Claude Sonnet 4</span>
                  </div>
                </div>
              </section>

              {/* Logo */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <img src="/tilde-logo.png" alt="tilde" className="w-6 h-6 rounded-lg" />
                <span className="font-semibold text-text-secondary/40">tilde</span>
              </div>
            </div>
          )}

          {/* Profile Sub-page */}
          {subPage === 'profile' && (
            <div className="px-4 pb-8 space-y-6">
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  Your Name
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <input
                    type="text"
                    placeholder="What should tilde call you?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  About You
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <textarea
                    placeholder="Add context to help tilde assist you better (profession, interests, preferences...)"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 text-base text-text-primary placeholder:text-text-secondary/40 focus:outline-none resize-none"
                  />
                </div>
                <p className="text-sm text-text-secondary/50 px-4 mt-2">
                  This helps tilde give you more personalized responses.
                </p>
              </section>
            </div>
          )}

          {/* API Key Sub-page */}
          {subPage === 'apikey' && (
            <div className="px-4 pb-8 space-y-6">
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  API Key
                </h3>
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-ant-api03-..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setError('')
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className={cn(
                        "w-full px-4 py-3 pr-12 text-base font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none",
                        error && "text-red-500"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary/50 pressable"
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
                </div>

                {error && (
                  <p className="text-sm text-red-500 px-4 mt-2">{error}</p>
                )}

                {apiKey && !error && (
                  <div className="flex items-center gap-2 px-4 mt-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-600">API key configured</span>
                  </div>
                )}

                <p className="text-sm text-text-secondary/50 px-4 mt-2">
                  Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </section>

              <section>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-base text-amber-800 font-medium">Keep your key private</p>
                      <p className="text-sm text-amber-700/70 mt-1">
                        Your API key is stored securely on this device only and is never sent to our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* App Icon Sub-page */}
          {subPage === 'appicon' && (
            <div className="px-4 pb-8 space-y-6">
              <section>
                <h3 className="text-sm font-normal text-text-secondary/70 uppercase px-4 mb-2">
                  Choose Icon
                </h3>
                <div className="bg-white rounded-xl overflow-hidden p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {APP_ICONS.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => handleIconSelect(icon.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl transition-all pressable',
                          selectedIcon === icon.id
                            ? 'bg-accent/10 ring-2 ring-accent'
                            : 'bg-surface hover:bg-surface/80'
                        )}
                      >
                        <img 
                          src={`/${icon.id}`} 
                          alt={icon.name} 
                          className="w-16 h-16 rounded-2xl shadow-lg"
                        />
                        <span className={cn(
                          'text-xs font-medium',
                          selectedIcon === icon.id ? 'text-accent' : 'text-text-secondary'
                        )}>
                          {icon.name}
                        </span>
                        {selectedIcon === icon.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-text-secondary/50 px-4 mt-3">
                  The app icon will be updated on your home screen.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
