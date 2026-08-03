// Matches the `tasks` table schema from the assessment brief, including
// the bonus fields (description, priority, due_date, assignee_id).

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'

export interface TeamMember {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  user_id: string
  created_at: string
  description?: string | null
  priority: TaskPriority
  due_date?: string | null // ISO date string, e.g. "2026-08-15"
  assignee_id?: string | null
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  body: string
  created_at: string
}

export interface ActivityEntry {
  id: string
  task_id: string
  user_id: string
  message: string
  created_at: string
}

export interface Label {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
]

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}