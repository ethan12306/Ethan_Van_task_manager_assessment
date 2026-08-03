import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Comment } from '../types/task'

export function useComments(taskId: string | undefined, userId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (!error) setComments(data as Comment[])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  async function addComment(body: string) {
    if (!taskId || !userId || !body.trim()) return

    const tempId = `temp-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      task_id: taskId,
      user_id: userId,
      body: body.trim(),
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, body: body.trim() })
      .select()
      .single()

    if (error) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      return
    }
    setComments((prev) => prev.map((c) => (c.id === tempId ? (data as Comment) : c)))
  }

  return { comments, loading, addComment }
}
