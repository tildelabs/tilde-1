import { useState, useEffect } from 'react'
import { Page } from 'framework7-react'
import { getSettings, updateSettings } from '@/storage/settings'
import { getProfile, updateProfile } from '@/storage/profile'
import { validateApiKey } from '@/brain/claude'
import { hapticNotification, hapticImpact } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface SettingsViewProps {
  f7router?: any
}

export function SettingsView({ f7router }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState('')
  const [originalApiKey, setOriginalApiKey] = useState('')
  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    async function load() {
      const settings = await getSettings()
      const profile = await getProfile()

      setApiKey(settings.apiKey)
      setOriginalApiKey(settings.apiKey)
      setName(profile.name)
      setContext(profile.context)
    }
    load()
  }, [])

  const handleSave = async () => {
    setError('')
    setSaved(false)

    // Validate API key if it changed
    if (apiKey && apiKey !== originalApiKey) {
      setValidating(true)
      const isValid = await validateApiKey(apiKey)
      setValidating(false)

      if (!isValid) {
        setError('Invalid API key. Please check and try again.')
        hapticNotification('error')
        return
      }
    }

    await updateSettings({ apiKey })
    await updateProfile({ name, context })
    setOriginalApiKey(apiKey)

    hapticNotification('success')
    setSaved(true)

    setTimeout(() => setSaved(false), 2000)
  }

  const handleBack = async () => {
    await hapticImpact('light')
    f7router?.back()
  }

  return (
    <Page className="bg-gradient-to-b from-white via-white to-gray-50/50">
      {/* Header with dynamic island spacing */}
      <div 
        className="fixed top-0 left-0 right-0 z-20 pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <div className="flex items-center px-4 pt-2 pb-2">
          <button
            onClick={handleBack}
            className="pointer-events-auto w-11 h-11 rounded-full floating-glass-btn flex items-center justify-center text-accent"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 flex justify-center pointer-events-auto">
            <div className="px-5 py-2 rounded-full floating-glass-btn">
              <h1 className="font-semibold font-mono text-text-primary text-sm">
                Settings
              </h1>
            </div>
          </div>
          <div className="w-11" />
        </div>
      </div>

      {/* Content */}
      <div 
        className="h-full overflow-y-auto pb-32"
        style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 12px) + 70px)' }}
      >
        <div className="px-4 space-y-6">
          {/* Profile Section */}
          <section className="animate-fade-in">
            <h3 className="text-xs font-semibold text-text-secondary/70 uppercase tracking-wider mb-3 px-1 font-mono">
              Profile
            </h3>
            <div className="space-y-4">
              {/* Name Input */}
              <div className="liquid-glass rounded-2xl p-4">
                <label className="block text-xs font-medium text-text-secondary/70 mb-2 font-mono uppercase tracking-wide">
                  Your name
                </label>
                <input
                  type="text"
                  placeholder="What should tilde call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-0 py-2 bg-transparent border-0 border-b border-border/50 font-mono text-text-primary text-[15px] placeholder:text-text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {/* Context Input */}
              <div className="liquid-glass rounded-2xl p-4">
                <label className="block text-xs font-medium text-text-secondary/70 mb-2 font-mono uppercase tracking-wide">
                  About you
                </label>
                <textarea
                  placeholder="Add context that helps tilde assist you better (e.g., profession, interests, preferences)"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full px-0 py-2 bg-transparent border-0 font-mono text-text-primary text-[15px] placeholder:text-text-secondary/30 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </section>

          {/* API Key Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <h3 className="text-xs font-semibold text-text-secondary/70 uppercase tracking-wider mb-3 px-1 font-mono">
              API Configuration
            </h3>
            <div className="liquid-glass rounded-2xl p-4">
              <label className="block text-xs font-medium text-text-secondary/70 mb-2 font-mono uppercase tracking-wide">
                Anthropic API Key
              </label>
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
                    "w-full px-0 py-2 pr-10 bg-transparent border-0 border-b font-mono text-[14px] text-text-primary placeholder:text-text-secondary/30 focus:outline-none transition-colors",
                    error ? 'border-red-400' : 'border-border/50 focus:border-accent/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-text-secondary/50 hover:text-text-secondary pressable"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
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
              
              {error && (
                <div className="flex items-center gap-2 mt-3 text-red-500">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm font-mono">{error}</p>
                </div>
              )}
              
              {apiKey && !error && (
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-mono">API key configured</p>
                </div>
              )}
              
              <p className="mt-4 text-xs text-text-secondary/50 font-mono leading-relaxed">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  console.anthropic.com
                </a>
                . Your key is stored securely on this device only.
              </p>
            </div>
          </section>

          {/* Data & Privacy Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xs font-semibold text-text-secondary/70 uppercase tracking-wider mb-3 px-1 font-mono">
              Data & Privacy
            </h3>
            <div className="liquid-glass rounded-2xl divide-y divide-border/30">
              {/* Local Storage */}
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary font-mono text-[15px]">Local storage only</h4>
                  <p className="text-xs text-text-secondary/60 font-mono mt-1 leading-relaxed">
                    All conversations, settings, and your API key are stored locally on your device. Nothing is sent to our servers.
                  </p>
                </div>
              </div>

              {/* Direct API */}
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary font-mono text-[15px]">Direct API connection</h4>
                  <p className="text-xs text-text-secondary/60 font-mono mt-1 leading-relaxed">
                    Messages go directly from your device to Anthropic's API. We never see or store your conversations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* App Info */}
          <section className="animate-fade-in pb-4" style={{ animationDelay: '0.15s' }}>
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src="/tilde-logo.png" alt="tilde" className="w-6 h-6 rounded-lg" />
                <span className="font-mono font-semibold text-text-primary">tilde</span>
              </div>
              <p className="text-xs text-text-secondary/40 font-mono">
                Version 1.0.0
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Floating Save Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 px-4 pointer-events-none z-10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <button
          onClick={handleSave}
          disabled={validating || !apiKey}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold font-mono text-[15px] pointer-events-auto transition-all duration-300',
            saved
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
              : validating || !apiKey
                ? 'liquid-glass text-text-secondary/40 cursor-not-allowed'
                : 'floating-glass-btn-accent text-white'
          )}
        >
          {validating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Validating...
            </span>
          ) : saved ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </Page>
  )
}
