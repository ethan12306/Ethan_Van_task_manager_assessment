interface BoardStatsProps {
  total: number
  completed: number
  overdue: number
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="stat-digit"
        style={{ fontSize: '15px', color: tone ?? 'var(--ink)' }}
      >
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{label}</span>
    </div>
  )
}

export function BoardStats({ total, completed, overdue }: BoardStatsProps) {
  return (
    <div className="flex items-center gap-5 mb-4 max-w-6xl mx-auto">
      <Stat value={total} label="tasks" />
      <Stat value={completed} label="completed" tone="var(--status-done)" />
      <Stat value={overdue} label="overdue" tone={overdue > 0 ? '#B3452F' : undefined} />
    </div>
  )
}
