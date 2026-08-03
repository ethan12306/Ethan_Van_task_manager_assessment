import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActivityEntry } from '../types/task'

export function useActivityLog(taskId: string | undefined) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false

    async function fetchLog() {
      setLoading(true)
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      if (!cancelled) {
        if (!error) setEntries(data as ActivityEntry[])
        setLoading(false)
      }
    }

    fetchLog()
    return () => {
      cancelled = true
    }
  }, [taskId])

  return { entries, loading }
}
