import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Ensures every visitor has an anonymous Supabase auth session,
// so their tasks can be tied to a user_id and protected by RLS.
export function useGuestSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initSession() {
      const { data: existing } = await supabase.auth.getSession()

      if (existing.session?.user) {
        setUser(existing.session.user)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Failed to create guest session:', error.message)
      } else {
        setUser(data.user)
      }
      setLoading(false)
    }

    initSession()
  }, [])

  return { user, loading }
}
