import type { TaskPriority, TeamMember, Label } from '../types/task'

interface BoardToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  priorityFilter: TaskPriority | ''
  onPriorityFilterChange: (v: TaskPriority | '') => void
  assigneeFilter: string
  onAssigneeFilterChange: (v: string) => void
  labelFilter: string
  onLabelFilterChange: (v: string) => void
  members: TeamMember[]
  labels: Label[]
}

const selectStyle = {
  border: '1px solid var(--border)',
  color: 'var(--ink-muted)',
  background: 'var(--surface)',
}

export function BoardToolbar({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  labelFilter,
  onLabelFilterChange,
  members,
  labels,
}: BoardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 max-w-6xl mx-auto">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search tasks…"
        className="flex-1 min-w-[160px] text-sm rounded-md px-3 py-2 outline-none"
        style={{ border: '1px solid var(--border)', color: 'var(--ink)', background: 'var(--surface)' }}
      />

      <select
        value={priorityFilter}
        onChange={(e) => onPriorityFilterChange(e.target.value as TaskPriority | '')}
        className="text-sm rounded-md px-2 py-2 outline-none capitalize"
        style={selectStyle}
      >
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </select>

      {members.length > 0 && (
        <select
          value={assigneeFilter}
          onChange={(e) => onAssigneeFilterChange(e.target.value)}
          className="text-sm rounded-md px-2 py-2 outline-none"
          style={selectStyle}
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}

      {labels.length > 0 && (
        <select
          value={labelFilter}
          onChange={(e) => onLabelFilterChange(e.target.value)}
          className="text-sm rounded-md px-2 py-2 outline-none"
          style={selectStyle}
        >
          <option value="">All labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
