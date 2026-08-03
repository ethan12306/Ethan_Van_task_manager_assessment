import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamMember } from '../types/task'

// A small rotating palette so members get visually distinct avatar chips
// without the user having to pick a color themselves.
const AVATAR_COLORS = ['#2E7D4F', '#D9A63E', '#1F3A5F', '#B3452F', '#6C4CE0']

export function useTeamMembers(userId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error) setMembers(data as TeamMember[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  async function addMember(name: string) {
    if (!userId || !name.trim()) return
    const color = AVATAR_COLORS[members.length % AVATAR_COLORS.length]

    const { data, error } = await supabase
      .from('team_members')
      .insert({ name: name.trim(), color, user_id: userId })
      .select()
      .single()

    if (!error) setMembers((prev) => [...prev, data as TeamMember])
  }

  return { members, loading, addMember, refetch: fetchMembers }
}
