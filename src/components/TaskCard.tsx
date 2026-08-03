import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TeamMember, Label } from '../types/task'

interface TaskCardProps {
  task: Task
  displayNumber: number
  assignee?: TeamMember
  labels?: Label[]
  onClick?: () => void
}

const STATUS_VAR: Record<Task['status'], string> = {
  todo: 'var(--status-todo)',
  in_progress: 'var(--status-in_progress)',
  in_review: 'var(--status-in_review)',
  done: 'var(--status-done)',
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  high: '#B3452F',
  normal: '#9CA39D',
  low: '#C7CBC3',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDueDate(dateStr: string) {
  const due = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)

  let label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  let tone: 'overdue' | 'soon' | 'normal' = 'normal'
  if (diffDays < 0) tone = 'overdue'
  else if (diffDays <= 2) tone = 'soon'
  if (diffDays === 0) label = 'Today'
  return { label, tone }
}

const DUE_TONE_COLOR: Record<string, string> = {
  overdue: '#B3452F',
  soon: '#D9A63E',
  normal: 'var(--ink-muted)',
}

// Pure presentational card — reused by both the sortable card and the
// floating DragOverlay copy, so the two stay visually identical.
export function TaskCardVisual({ task, displayNumber, assignee, labels }: TaskCardProps) {
  const due = task.due_date ? formatDueDate(task.due_date) : null

  return (
    <div
      style={{
        boxShadow: 'var(--shadow-md)',
        borderBottom: `3px solid ${STATUS_VAR[task.status]}`,
      }}
      className="bg-white rounded-md p-3 w-full"
    >
      <div className="flex items-start justify-between mb-1.5">
        <span className="stat-digit">#{String(displayNumber).padStart(3, '0')}</span>
        <span
          title={`${task.priority} priority`}
          className="w-1.5 h-1.5 rounded-full mt-1"
          style={{ background: PRIORITY_COLOR[task.priority] }}
        />
      </div>

      {labels && labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {labels.map((l) => (
            <span
              key={l.id}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${l.color}1A`, color: l.color, fontFamily: 'var(--font-body)' }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <p
        className="text-sm leading-snug mb-2"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}
      >
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs leading-snug mb-2 line-clamp-2" style={{ color: 'var(--ink-muted)' }}>
          {task.description}
        </p>
      )}

      {(due || assignee) && (
        <div className="flex items-center justify-between mt-2">
          {due ? (
            <span
              className="stat-digit"
              style={{ color: DUE_TONE_COLOR[due.tone], fontSize: '11px' }}
            >
              {due.label}
            </span>
          ) : <span />}

          {assignee && (
            <span
              title={assignee.name}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ background: assignee.color, fontFamily: 'var(--font-mono)' }}
            >
              {initials(assignee.name)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function TaskCard({ task, displayNumber, assignee, labels, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="mb-2 cursor-grab active:cursor-grabbing transition-shadow touch-none"
    >
      <TaskCardVisual task={task} displayNumber={displayNumber} assignee={assignee} labels={labels} />
    </div>
  )
}
