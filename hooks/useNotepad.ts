'use client'

import { useState, useEffect, useCallback } from 'react'

export interface NoteSnippet {
  id: string
  title: string
  content: string
  createdAt: number
}

interface NotepadState {
  snippets: NoteSnippet[]
  isOpen: boolean
}

const DEFAULT_STATE: NotepadState = { snippets: [], isOpen: false }

function storageKey(userId: string) {
  return `notepad:${userId}`
}

function loadFromStorage(userId: string): NotepadState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as NotepadState) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function saveToStorage(userId: string, state: NotepadState) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    // quota exceeded — silently ignore
  }
}

export function useNotepad(userId: string | undefined) {
  const [state, setState] = useState<NotepadState>(DEFAULT_STATE)

  // Carrega do localStorage quando o userId estiver disponível
  useEffect(() => {
    if (!userId) return
    setState(loadFromStorage(userId))
  }, [userId])

  // Persiste sempre que o estado muda
  useEffect(() => {
    if (!userId) return
    saveToStorage(userId, state)
  }, [userId, state])

  const setOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isOpen: open }))
  }, [])

  const addSnippet = useCallback((title: string, content: string) => {
    const snippet: NoteSnippet = {
      id: crypto.randomUUID(),
      title: title.trim() || 'Sem título',
      content,
      createdAt: Date.now(),
    }
    setState(prev => ({ ...prev, snippets: [snippet, ...prev.snippets] }))
  }, [])

  const updateSnippet = useCallback((id: string, changes: Partial<Pick<NoteSnippet, 'title' | 'content'>>) => {
    setState(prev => ({
      ...prev,
      snippets: prev.snippets.map(s => (s.id === id ? { ...s, ...changes } : s)),
    }))
  }, [])

  const deleteSnippet = useCallback((id: string) => {
    setState(prev => ({ ...prev, snippets: prev.snippets.filter(s => s.id !== id) }))
  }, [])

  return {
    snippets: state.snippets,
    isOpen: state.isOpen,
    setOpen,
    addSnippet,
    updateSnippet,
    deleteSnippet,
  }
}
