import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import type { EventRow } from './api/types'
import { errMsg, todayISO } from './util'

interface Ctx {
  events: EventRow[]
  current: EventRow | null
  setCurrentId: (id: number) => void
  reload: () => Promise<void>
  loading: boolean
  error: string | null
}

const EventCtx = createContext<Ctx | null>(null)
const KEY = 'freestore.currentEventId'

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventRow[]>([])
  const [currentId, setId] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem(KEY)
      return v ? Number(v) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const list = await api.listEvents()
      setEvents([...list].sort((a, b) => b.event_date.localeCompare(a.event_date)))
      setError(null)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const setCurrentId = useCallback((id: number) => {
    setId(id)
    try {
      localStorage.setItem(KEY, String(id))
    } catch {
      /* ignore */
    }
  }, [])

  // Default to the saved choice, else today's event, else the most recent one.
  const current = useMemo(
    () =>
      events.find((e) => e.id === currentId) ??
      events.find((e) => e.event_date === todayISO()) ??
      events[0] ??
      null,
    [events, currentId],
  )

  const value = useMemo(
    () => ({ events, current, setCurrentId, reload, loading, error }),
    [events, current, setCurrentId, reload, loading, error],
  )
  return <EventCtx.Provider value={value}>{children}</EventCtx.Provider>
}

export function useEvents(): Ctx {
  const ctx = useContext(EventCtx)
  if (!ctx) throw new Error('useEvents must be used inside <EventProvider>')
  return ctx
}
