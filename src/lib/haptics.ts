/**
 * iOS Haptic Feedback utilities
 * Uses Capacitor Haptics for native iOS haptic feedback
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Fallback for web - use vibration API if available
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 }
      navigator.vibrate(patterns[style])
    }
    return
  }

  const styleMap: Record<string, ImpactStyle> = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy
  }

  try {
    await Haptics.impact({ style: styleMap[style]! })
  } catch {
    // Silently fail if haptics not supported
  }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error'): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Fallback for web
    if ('vibrate' in navigator) {
      const patterns = {
        success: [10, 50, 10],
        warning: [20, 40, 20],
        error: [30, 50, 30, 50, 30]
      }
      navigator.vibrate(patterns[type])
    }
    return
  }

  const typeMap: Record<string, NotificationType> = {
    success: NotificationType.Success,
    warning: NotificationType.Warning,
    error: NotificationType.Error
  }

  try {
    await Haptics.notification({ type: typeMap[type]! })
  } catch {
    // Silently fail if haptics not supported
  }
}

export async function hapticSelection(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Fallback for web
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
    return
  }

  try {
    await Haptics.selectionStart()
  } catch {
    // Silently fail if haptics not supported
  }
}
