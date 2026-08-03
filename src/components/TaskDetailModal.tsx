import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Task, TeamMember, Label } from '../types/task'
import { useComments } from '../hooks/useComments'
import { useActivityLog } from '../hooks/useActivityLog'

interface TaskDetailModalProps {
  task: Task
  assignee?: TeamMember
  userId: string
  labels: Label[]
  activeLabelIds: string[]
  onToggleLabel: (labelId: string) => void
  onCreateLabel: (name: string) => Promise<void> | void
  onClose: () => void
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  high: '#B3452F',
  normal: '#9CA39D',
  low: '#C7CBC3',
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function TaskDetailModal({
  task,
  assignee,
  userId,
  labels,
  activeLabelIds,
  onToggleLabel,
  onCreateLabel,
  onClose,
}: TaskDetailModalProps) {
  const { comments, loading, addComment } = useComments(task.id, userId)
  const { entries: activity, loading: activityLoading } = useActivityLog(task.id)
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addingLabel, setAddingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim() || submitting) return
    setSubmitting(true)
    await addComment(draft)
    setDraft('')
    setSubmitting(false)
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return
    await onCreateLabel(newLabelName)
    setNewLabelName('')
    setAddingLabel(false)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(20, 35, 28, 0.4)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg p-5 max-h-[85vh] flex flex-col"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-md)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h2
            className="text-base font-semibold pr-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            {task.title}
          </h2>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--ink-muted)' }}>
            ×
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: PRIORITY_COLOR[task.priority] }}
            />
            {task.priority}
          </span>
          {task.due_date && (
            <span className="stat-digit" style={{ fontSize: '11px' }}>
              due {new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {assignee && (
            <span className="flex items-center gap-1">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                style={{ background: assignee.color, fontFamily: 'var(--font-mono)' }}
              >
                {assignee.name[0]?.toUpperCase()}
              </span>
              {assignee.name}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-sm mb-3" style={{ color: 'var(--ink)' }}>
            {task.description}
          </p>
        )}

        {/* Labels */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {labels.map((l) => {
            const active = activeLabelIds.includes(l.id)
            return (
              <button
                key={l.id}
                onClick={() => onToggleLabel(l.id)}
                className="text-[11px] font-medium px-2 py-1 rounded transition-opacity"
                style={{
                  background: active ? `${l.color}1A` : 'transparent',
                  color: active ? l.color : 'var(--ink-muted)',
                  border: `1px solid ${active ? l.color : 'var(--border)'}`,
                }}
              >
                {l.name}
              </button>
            )
          })}

          {!addingLabel ? (
            <button
              onClick={() => setAddingLabel(true)}
              className="text-[11px] px-2 py-1 rounded"
              style={{ border: '1px dashed var(--border)', color: 'var(--ink-muted)' }}
            >
              + Label
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <input
                autoFocus
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateLabel()
                  }
                }}
                placeholder="Label name"
                className="text-[11px] rounded px-2 py-1 outline-none w-24"
                style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
              />
              <button
                onClick={handleCreateLabel}
                className="text-[11px] font-medium px-2 py-1 rounded text-white"
                style={{ background: 'var(--accent)' }}
              >
                Add
              </button>
            </span>
          )}
        </div>

        <div className="h-px mb-3" style={{ background: 'var(--border)' }} />

        {/* Tabs */}
        <div className="flex gap-4 mb-3">
          <button
            onClick={() => setTab('comments')}
            className="text-xs font-semibold pb-1"
            style={{
              color: tab === 'comments' ? 'var(--accent)' : 'var(--ink-muted)',
              borderBottom: tab === 'comments' ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            Comments
          </button>
          <button
            onClick={() => setTab('activity')}
            className="text-xs font-semibold pb-1"
            style={{
              color: tab === 'activity' ? 'var(--accent)' : 'var(--ink-muted)',
              borderBottom: tab === 'activity' ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            Activity
          </button>
        </div>

        {/* Comments / Activity */}
        <div className="flex-1 overflow-y-auto mb-3">
          {tab === 'comments' ? (
            loading ? (
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id}>
                    <p className="text-sm" style={{ color: 'var(--ink)' }}>{c.body}</p>
                    <p className="stat-digit mt-0.5" style={{ fontSize: '10px' }}>{timeAgo(c.created_at)}</p>
                  </div>
                ))}
              </div>
            )
          ) : activityLoading ? (
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Loading…</p>
          ) : activity.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>No activity yet.</p>
          ) : (
            <div className="relative pl-3">
              <div className="absolute left-0 top-1 bottom-1 w-px" style={{ background: 'var(--border)' }} />
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="relative pl-3">
                    <span
                      className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                    <p className="text-sm" style={{ color: 'var(--ink)' }}>{a.message}</p>
                    <p className="stat-digit mt-0.5" style={{ fontSize: '10px' }}>{timeAgo(a.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add comment — only shown on the Comments tab */}
        {tab === 'comments' && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 text-sm rounded-md px-3 py-2 outline-none"
              style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || submitting}
              className="text-sm font-medium px-3 py-2 rounded-md text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
