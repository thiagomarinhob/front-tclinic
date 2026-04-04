'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNotepad, type NoteSnippet } from '@/hooks/useNotepad'
import {
  NotebookPen,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'

interface FloatingNotepadProps {
  userId: string
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function FloatingNotepad({ userId }: FloatingNotepadProps) {
  const { snippets, isOpen, setOpen, addSnippet, updateSnippet, deleteSnippet } =
    useNotepad(userId)

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  function openNew() {
    setView('new')
    setEditingId(null)
  }

  function openEdit(id: string) {
    setView('edit')
    setEditingId(id)
  }

  function backToList() {
    setView('list')
    setEditingId(null)
  }

  function handleToggle() {
    setOpen(!isOpen)
    if (!isOpen) setView('list')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Painel expandido */}
      {isOpen && (
        <div
          className={cn(
            'flex flex-col w-80 rounded-xl border bg-background shadow-2xl',
            'overflow-hidden',
            'animate-in slide-in-from-bottom-4 fade-in-0 duration-200',
          )}
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 text-primary-foreground">
              <NotebookPen className="size-4" />
              <span className="text-sm font-semibold">Bloco de Anotações</span>
              {snippets.length > 0 && (
                <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-medium">
                  {snippets.length}
                </span>
              )}
            </div>
            <button
              onClick={handleToggle}
              className="rounded p-0.5 text-primary-foreground/80 transition hover:text-primary-foreground"
              aria-label="Recolher bloco de anotações"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {view === 'list' && (
              <ListView
                snippets={snippets}
                onNew={openNew}
                onEdit={openEdit}
                onDelete={deleteSnippet}
              />
            )}
            {view === 'new' && (
              <SnippetForm
                onSave={(title, content) => {
                  addSnippet(title, content)
                  backToList()
                }}
                onCancel={backToList}
              />
            )}
            {view === 'edit' && editingId && (
              <SnippetForm
                initial={snippets.find(s => s.id === editingId)}
                onSave={(title, content) => {
                  updateSnippet(editingId, { title, content })
                  backToList()
                }}
                onCancel={backToList}
              />
            )}
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={handleToggle}
        aria-label="Abrir bloco de anotações"
        className={cn(
          'flex size-12 items-center justify-center rounded-full shadow-lg transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
          isOpen && 'rotate-0',
        )}
      >
        {isOpen ? <X className="size-5" /> : <NotebookPen className="size-5" />}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lista de snippets
// ---------------------------------------------------------------------------

function ListView({
  snippets,
  onNew,
  onEdit,
  onDelete,
}: {
  snippets: NoteSnippet[]
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {snippets.length === 0 ? 'Nenhuma anotação' : `${snippets.length} anotação${snippets.length > 1 ? 'ões' : ''}`}
        </span>
        <Button size="icon-sm" onClick={onNew} title="Nova anotação">
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Snippets */}
      <div className="flex-1 overflow-y-auto">
        {snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <NotebookPen className="size-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sem anotações ainda</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Crie snippets de texto para copiar rapidamente
              </p>
            </div>
            <Button size="sm" onClick={onNew}>
              <Plus className="size-3.5" />
              Nova anotação
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {snippets.map(snippet => (
              <SnippetRow
                key={snippet.id}
                snippet={snippet}
                onEdit={() => onEdit(snippet.id)}
                onDelete={() => onDelete(snippet.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Linha de snippet
// ---------------------------------------------------------------------------

function SnippetRow({
  snippet,
  onEdit,
  onDelete,
}: {
  snippet: NoteSnippet
  onEdit: () => void
  onDelete: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet.content)
    setCopied(true)
    toast.success('Texto copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <li className="group flex items-start gap-2 px-4 py-3 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{snippet.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {snippet.content}
        </p>
      </div>
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleCopy}
          title="Copiar texto"
          className={cn(
            'rounded p-1 transition-colors',
            copied
              ? 'text-green-600 dark:text-green-400'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
        <button
          onClick={onEdit}
          title="Editar"
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Excluir"
          className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Formulário de criação / edição
// ---------------------------------------------------------------------------

function SnippetForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: NoteSnippet
  onSave: (title: string, content: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    contentRef.current?.focus()
  }, [])

  function handleSave() {
    if (!content.trim()) return
    onSave(title, content)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <span className="text-xs font-medium text-muted-foreground">
          {initial ? 'Editar anotação' : 'Nova anotação'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <input
          type="text"
          placeholder="Título (ex: Atestado padrão)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={cn(
            'w-full rounded-md border bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
          maxLength={60}
        />
        <textarea
          ref={contentRef}
          placeholder="Cole ou digite o texto que deseja reutilizar..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={7}
          className={cn(
            'w-full flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm leading-relaxed',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      </div>

      <div className="flex justify-end gap-2 border-t px-4 py-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!content.trim()}>
          Salvar
        </Button>
      </div>
    </div>
  )
}
