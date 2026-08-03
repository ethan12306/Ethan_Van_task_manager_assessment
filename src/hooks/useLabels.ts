import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Label } from '../types/task'

const LABEL_COLORS = ['#2E7D4F', '#D9A63E', '#1F3A5F', '#B3452F', '#6C4CE0', '#9CA39D']

// taskLabels: maps task_id -> array of label_id, so the board can look up
// "which labels does this task have" without a join query on every render.
export function useLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([])
  const [taskLabels, setTaskLabels] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [labelsRes, joinRes] = await Promise.all([
      supabase.from('labels').select('*').order('created_at', { ascending: true }),
      supabase.from('task_labels').select('task_id, label_id'),
    ])

    if (!labelsRes.error) setLabels(labelsRes.data as Label[])

    if (!joinRes.error) {
      const map: Record<string, string[]> = {}
      for (const row of joinRes.data as { task_id: string; label_id: string }[]) {
        map[row.task_id] = [...(map[row.task_id] ?? []), row.label_id]
      }
      setTaskLabels(map)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function createLabel(name: string) {
    if (!userId || !name.trim()) return
    const color = LABEL_COLORS[labels.length % LABEL_COLORS.length]
    const { data, error } = await supabase
      .from('labels')
      .insert({ name: name.trim(), color, user_id: userId })
      .select()
      .single()

    if (!error) setLabels((prev) => [...prev, data as Label])
  }

  async function toggleLabel(taskId: string, labelId: string) {
    if (!userId) return
    const current = taskLabels[taskId] ?? []
    const hasLabel = current.includes(labelId)

    // Optimistic update
    setTaskLabels((prev) => ({
      ...prev,
      [taskId]: hasLabel ? current.filter((id) => id !== labelId) : [...current, labelId],
    }))

    if (hasLabel) {
      await supabase.from('task_labels').delete().eq('task_id', taskId).eq('label_id', labelId)
    } else {
      await supabase.from('task_labels').insert({ task_id: taskId, label_id: labelId, user_id: userId })
    }
  }

  return { labels, taskLabels, loading, createLabel, toggleLabel }
}
