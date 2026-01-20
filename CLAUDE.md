# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tilde is a native iOS mobile app providing an AI chat interface powered by Claude API. Built with React, Framework7, Capacitor, and TypeScript with local-first data storage using Dexie (IndexedDB).

## Commands

```bash
npm run dev          # Start Vite dev server (web preview)
npm run build        # Compile TypeScript + Vite build
npm run cap:sync     # Sync web build to iOS Capacitor project
npm run cap:open     # Open iOS project in Xcode
npm run cap:build    # Full build + sync for iOS deployment
```

No test or lint commands are configured.

## Architecture

**Tech Stack:** React 19, Framework7/Framework7-React (iOS-native UI), Vite 6, Capacitor 6, Dexie 4, Zustand 5, Tailwind CSS 3

**Key Directories:**
- `src/brain/` - Claude API integration (`claude.ts` for streaming, `prompts.ts` for system prompt building)
- `src/features/` - Feature modules: chat, conversations, settings, onboarding
- `src/storage/` - Dexie database layer with CRUD operations for conversations, settings, profile, attachments
- `src/components/ui/` - Reusable UI components (Button, Input, TextArea)

**Data Flow:**
1. User input captured in ChatView → stored in Dexie
2. `streamMessage()` calls Claude API with streaming enabled
3. Tokens streamed back and rendered in real-time
4. System prompt personalized from user profile (name, purposes, style)
5. Messages serialized as markdown in Dexie

**Storage Model:** All data stored locally via Dexie IndexedDB - conversations, messages (markdown format), attachments (blobs), settings, and user profile.

## Important Patterns

- **Path alias:** `@/` maps to `src/` (configured in tsconfig and vite)
- **Safe area handling:** Tailwind classes for iOS notch/home indicator (`pb-safe`, `pt-safe`)
- **Haptic feedback:** Use `src/lib/haptics.ts` for iOS vibrations
- **API key storage:** Managed via `src/storage/settings.ts`, validated during onboarding
- **Streaming responses:** Claude API calls use fetch with streaming - see `streamMessage()` in `src/brain/claude.ts`

## iOS/Capacitor Notes

- App ID: `com.tildelabs.tilde`
- Config in `capacitor.config.ts` - splash screen, status bar, keyboard settings
- Always run `npm run cap:sync` after web build changes to update iOS project
- Custom colors defined in `tailwind.config.js` (accent: #E85B2B)
