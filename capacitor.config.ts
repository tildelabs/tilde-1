import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tildelabs.tilde',
  appName: 'tilde',
  webDir: 'dist',
  ios: {
    scheme: 'tilde',
    contentInset: 'automatic',
    backgroundColor: '#FFFFFF',
    preferredContentMode: 'mobile'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#E85B2B',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#FFFFFF'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
}

export default config
