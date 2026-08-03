import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus, TeamMember, Label } from '../types/task'
import { TaskCard } from './TaskCard'

interface ColumnProps {
  id: TaskStatus
  label: string
  tasks: Task[]
  members: TeamMember[]
  labels: Label[]
  taskLabels: Record<string, string[]>
  onTaskClick: (task: Task) => void
}

const STATUS_VAR: Record<TaskStatus, string> = {
  todo: 'var(--status-todo)',
  in_progress: 'var(--status-in_progress)',
  in_review: 'var(--status-in_review)',
  done: 'var(--status-done)',
}

export function Column({ id, label, tasks, members, labels, taskLabels, onTaskClick }: ColumnProps) {
  // Registers this column as a drop target. When a column is empty,
  // dnd-kit needs somewhere to drop onto — the column div itself covers that.
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className="mb-3">
        <div className="flex items-baseline justify-between px-0.5">
          <h2
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            {label}
          </h2>
          <span className="stat-digit">{tasks.length}</span>
        </div>
        <div
          className="h-[2px] mt-2 rounded-full"
          style={{ background: STATUS_VAR[id] }}
        />
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 rounded-lg p-2 transition-colors"
        style={{
          background: isOver ? 'var(--accent-soft)' : 'var(--surface)',
          border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div
              className="flex items-center justify-center h-24 text-xs rounded-md border border-dashed"
              style={{ color: 'var(--ink-muted)', borderColor: 'var(--border)' }}
            >
              No tasks yet
            </div>
          ) : (
            tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                displayNumber={i + 1}
                assignee={members.find((m) => m.id === task.assignee_id)}
                labels={labels.filter((l) => (taskLabels[task.id] ?? []).includes(l.id))}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
