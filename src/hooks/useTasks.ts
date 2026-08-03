import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus } from '../types/task'
import { STATUS_LABEL } from '../types/task'

export interface NewTaskInput {
  title: string
  description?: string
  priority?: Task['priority']
  due_date?: string | null
  assignee_id?: string | null
}

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTasks(data as Task[])
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Optimistically adds the task locally, then confirms/corrects with the
  // real row (real id/timestamp) once Supabase responds.
  async function addTask(input: NewTaskInput) {
    if (!userId || !input.title.trim()) return

    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      title: input.title.trim(),
      status: 'todo',
      user_id: userId,
      created_at: new Date().toISOString(),
      description: input.description || null,
      priority: input.priority ?? 'normal',
      due_date: input.due_date || null,
      assignee_id: input.assignee_id || null,
    }
    setTasks((prev) => [...prev, optimisticTask])

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: input.title.trim(),
        status: 'todo',
        user_id: userId,
        description: input.description || null,
        priority: input.priority ?? 'normal',
        due_date: input.due_date || null,
        assignee_id: input.assignee_id || null,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
      return
    }

    setTasks((prev) => prev.map((t) => (t.id === tempId ? (data as Task) : t)))

    await supabase.from('activity_log').insert({
      task_id: (data as Task).id,
      user_id: userId,
      message: 'Created task',
    })
  }

  // Updates status locally right away (for a snappy drag-and-drop feel),
  // then persists to Supabase and logs the change to the activity timeline.
  // Reverts on failure.
  async function updateStatus(taskId: string, status: TaskStatus) {
    const previous = tasks
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === status) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))

    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) {
      setError(error.message)
      setTasks(previous)
      return
    }

    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: task.user_id,
      message: `Moved from ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[status]}`,
    })
  }

  async function reorder(newTasks: Task[]) {
    // Local-only reorder within a column. The schema doesn't include an
    // explicit `order` column, so this doesn't persist across reloads —
    // add an integer `position` column + update it here if you want that
    // to survive a refresh.
    setTasks(newTasks)
  }

  return { tasks, loading, error, addTask, updateStatus, reorder, refetch: fetchTasks }
}
