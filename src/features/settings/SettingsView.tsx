import { useState, useEffect } from 'react'
import { Page } from 'framework7-react'
import { Button } from '@/components/ui/Button'
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
      setName(profile.name)
      setContext(profile.context)
    }
    load()
  }, [])

  const handleSave = async () => {
    setError('')
    setSaved(false)

    // Validate API key if it changed
    const currentSettings = await getSettings()
    if (apiKey && apiKey !== currentSettings.apiKey) {
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

    hapticNotification('success')
    setSaved(true)

    setTimeout(() => setSaved(false), 2000)
  }

  const handleBack = async () => {
    await hapticImpact('light')
    f7router?.back()
  }

  return (
    <Page className="bg-white">
      {/* Header */}
      <header className="flex-shrink-0 safe-top bg-white/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-accent pressable -ml-2"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="flex-1 text-center font-semibold font-mono text-text-primary">
            Settings
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <section className="animate-fade-in">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1 font-mono">
              Profile
            </h3>
            <div className="bg-surface rounded-2xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-mono">Your name</label>
                <input
                  type="text"
                  placeholder="What should tilde call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-border font-mono text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-mono">About you</label>
                <textarea
                  placeholder="Add context that helps tilde assist you better"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-border font-mono text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>
            </div>
          </section>

          {/* API Key Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1 font-mono">
              API Key
            </h3>
            <div className="bg-surface rounded-2xl p-4">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('')
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className={cn(
                    "w-full px-4 py-3 pr-12 bg-white rounded-xl border font-mono text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-2 focus:ring-accent/20",
                    error ? 'border-red-500' : 'border-border'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text-secondary pressable"
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
                <p className="mt-2 text-sm text-red-500 font-mono">{error}</p>
              )}
              <p className="mt-3 text-sm text-text-secondary font-mono">
                Get your key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-medium"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          </section>

          {/* Data Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1 font-mono">
              Data
            </h3>
            <div className="bg-surface rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary font-mono">Your data is private</h4>
                    <p className="text-sm text-text-secondary font-mono">
                      Everything is stored locally on your device
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom border-t border-border bg-white">
        <Button
          onClick={handleSave}
          disabled={validating || !apiKey}
          className={cn(
            'w-full',
            saved && 'bg-green-500 hover:bg-green-500'
          )}
          size="lg"
        >
          {validating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Validating...
            </span>
          ) : saved ? (
            'Saved!'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </Page>
  )
}
