import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NewTaskInput } from '../hooks/useTasks'
import type { TaskPriority, TeamMember } from '../types/task'

interface CreateTaskModalProps {
  onClose: () => void
  onCreate: (input: NewTaskInput) => Promise<void> | void
  members: TeamMember[]
  onAddMember: (name: string) => Promise<void> | void
}

const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high']

export function CreateTaskModal({ onClose, onCreate, members, onAddMember }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [addingMember, setAddingMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    await onCreate({
      title,
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
    })
    setSubmitting(false)
    onClose()
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return
    await onAddMember(newMemberName)
    setNewMemberName('')
    setAddingMember(false)
  }

  const inputStyle = {
    border: '1px solid var(--border)',
    fontFamily: 'var(--font-body)',
    color: 'var(--ink)',
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(20, 35, 28, 0.4)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-md)' }}
      >
        <h2
          className="text-base font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
        >
          New Task
        </h2>

        <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="w-full text-sm rounded-md px-3 py-2 mb-3 outline-none"
          style={inputStyle}
        />

        <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details…"
          rows={2}
          className="w-full text-sm rounded-md px-3 py-2 mb-3 outline-none resize-none"
          style={inputStyle}
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-sm rounded-md px-2 py-2 outline-none capitalize"
              style={inputStyle}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm rounded-md px-2 py-2 outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <label className="block text-xs mb-1" style={{ color: 'var(--ink-muted)' }}>Assignee</label>
        {!addingMember ? (
          <div className="flex gap-2 mb-4">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="flex-1 text-sm rounded-md px-2 py-2 outline-none"
              style={inputStyle}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingMember(true)}
              className="text-xs px-2 rounded-md"
              style={{ border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
            >
              + New
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Teammate name"
              className="flex-1 text-sm rounded-md px-3 py-2 outline-none"
              style={inputStyle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddMember()
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="text-xs font-medium px-3 rounded-md text-white"
              style={{ background: 'var(--accent)' }}
            >
              Add
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-md"
            style={{ color: 'var(--ink-muted)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="text-sm font-medium px-4 py-1.5 rounded-md text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {submitting ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  )
}
