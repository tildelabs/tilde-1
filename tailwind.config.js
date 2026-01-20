/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#F9F9F9',
        border: '#E5E5E5',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        accent: '#E85B2B',
        'accent-hover': '#D14A1F',
        'accent-light': '#FFF0EB',
      },
      fontFamily: {
        sans: [
          'JetBrains Mono',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ],
      },
      fontSize: {
        'body': ['16px', { lineHeight: '1.5' }],
        'small': ['14px', { lineHeight: '1.5' }],
        'title': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'large': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'typing': 'typing 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        typing: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'ios-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
}
