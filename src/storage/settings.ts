import { db, type Settings } from './db'

const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  apiKey: '',
  theme: 'light',
  haptics: true,
  updated: new Date(),
}

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get('settings')
  if (!settings) {
    await db.settings.put(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  return settings
}

export async function updateSettings(updates: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({
    ...current,
    ...updates,
    updated: new Date(),
  })
}

export async function getApiKey(): Promise<string> {
  const settings = await getSettings()
  return settings.apiKey
}

export async function setApiKey(apiKey: string): Promise<void> {
  await updateSettings({ apiKey })
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey()
  return key.length > 0
}
