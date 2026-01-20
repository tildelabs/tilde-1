import { db, type Profile } from './db'

const DEFAULT_PROFILE: Profile = {
  id: 'profile',
  name: '',
  context: '',
  updated: new Date(),
}

export async function getProfile(): Promise<Profile> {
  const profile = await db.profile.get('profile')
  if (!profile) {
    await db.profile.put(DEFAULT_PROFILE)
    return DEFAULT_PROFILE
  }
  return profile
}

export async function updateProfile(updates: Partial<Omit<Profile, 'id'>>): Promise<void> {
  const current = await getProfile()
  await db.profile.put({
    ...current,
    ...updates,
    updated: new Date(),
  })
}
