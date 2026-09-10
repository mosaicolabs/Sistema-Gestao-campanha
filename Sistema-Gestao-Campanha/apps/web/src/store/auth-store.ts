import { create } from 'zustand'
import type { AuthResponse, SessionUser } from '@campanha/types'

const STORAGE_KEY = 'campanha.session'

type StoredSession = { accessToken: string; user: SessionUser }

function readStored(): StoredSession | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as StoredSession) : null
  } catch {
    return null
  }
}

type AuthState = {
  accessToken: string | null
  user: SessionUser | null
  setSession: (session: AuthResponse) => void
  clearSession: () => void
}

const initial = readStored()

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initial?.accessToken ?? null,
  user: initial?.user ?? null,
  setSession: (session) => {
    const stored = { accessToken: session.accessToken, user: session.user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    set(stored)
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ accessToken: null, user: null })
  },
}))
