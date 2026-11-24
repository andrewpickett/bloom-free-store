import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { VisitLimitError, type Checkin, type FamilySummary, type VisitLimitInfo } from '../api/types'
import { useEvents } from '../EventContext'
import Modal from '../components/Modal'
import NewFamilyForm from '../components/NewFamilyForm'
import { errBanner, formatDate, formatTime, useDebounced, type Msg } from '../util'

export default function CheckInPage() {
  const { current, reload } = useEvents()
  const eventId = current?.id ?? null

  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [results, setResults] = useState<FamilySummary[]>([])
  const [searching, setSearching] = useState(false)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [msg, setMsg] = useState<Msg | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [limitPrompt, setLimitPrompt] = useState<{ family: FamilySummary; info: VisitLimitInfo } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const loadCheckins = useCallback(async () => {
    if (eventId == null) {
      setCheckins([])
      return
    }
    try {
      setCheckins(await api.listCheckins(eventId))
    } catch (e) {
      setMsg(errBanner(e))
    }
  }, [eventId])

  useEffect(() => {
    void loadCheckins()
  }, [loadCheckins])

  const search = useCallback(async (term: string) => {
    setSearching(true)
    try {
      setResults(await api.searchFamilies(term))
    } catch (e) {
      setMsg(errBanner(e))
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    void search(debouncedQ.trim())
  }, [debouncedQ, search])

  const checkedInIds = useMemo(() => new Set(checkins.map((c) => c.family_id)), [checkins])

  async function doCheckIn(family: FamilySummary, override = false) {
    if (!current) return
    setBusyId(family.id)
    setMsg(null)
    try {
      await api.checkIn(current.id, family.id, override)
      setLimitPrompt(null)
      setMsg({ kind: 'ok', text: `${family.display_name} checked in.` })
      await Promise.all([loadCheckins(), reload(), search(debouncedQ.trim())])
    } catch (e) {
      if (e instanceof VisitLimitError) {
        setLimitPrompt({ family, info: e.info })
      } else {
        setMsg(errBanner(e))
      }
    } finally {
      setBusyId(null)
    }
  }

  if (!current) {
    return (
      <div className="card">
        <h2>Check-in</h2>
        <p>There’s no event yet. Create a shopping day on the Events page first.</p>
      </div>
    )
  }

  const atCapacity = current.capacity != null && checkins.length >= current.capacity

  return (
    <div className="two-col">
      <section className="card">
        <div className="card-head">
          <h2>Check in a family</h2>
          <button className="btn primary" onClick={() => setShowNew(true)}>
            + New family
          </button>
        </div>

        {msg && <div className={`banner ${msg.kind}`}>{msg.text}</div>}
        {atCapacity && (
          <div className="banner warn">
            This event has reached its capacity ({current.capacity}). You can still check families in.
          </div>
        )}

        <input
          className="search"
          type="search"
          autoFocus
          placeholder="Search by name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <ul className="list">
          {results.map((f) => {
            const done = checkedInIds.has(f.id)
            return (
              <li key={f.id}>
                <div className="grow">
                  <strong>{f.display_name}</strong>
                  <div className="muted">
                    {f.household_size} in household
                    {f.phone ? ` · ${f.phone}` : ''}
                    {f.last_visit ? ` · last visit ${formatDate(f.last_visit)}` : ' · no visits yet'}
                  </div>
                </div>
                <button
                  className="btn primary"
                  disabled={done || busyId === f.id}
                  onClick={() => void doCheckIn(f)}
                >
                  {done ? 'Checked in' : busyId === f.id ? '…' : 'Check in'}
                </button>
              </li>
            )
          })}
          {!searching && results.length === 0 && (
            <li className="empty">
              No matching families. Use <strong>+ New family</strong> to register them.
            </li>
          )}
        </ul>
      </section>

      <aside className="card">
        <div className="card-head">
          <h2>Checked in</h2>
          <span className="pill">
            {checkins.length}
            {current.capacity != null ? ` / ${current.capacity}` : ''}
          </span>
        </div>
        <ul className="list compact">
          {checkins.map((c) => (
            <li key={c.id}>
              <span className="grow">{c.display_name}</span>
              <span className="muted">{formatTime(c.checked_in_at)}</span>
            </li>
          ))}
          {checkins.length === 0 && <li className="empty">Nobody yet.</li>}
        </ul>
      </aside>

      {showNew && (
        <Modal title="Register a new family" onClose={() => setShowNew(false)}>
          <NewFamilyForm
            onCancel={() => setShowNew(false)}
            onCreated={(family) => {
              setShowNew(false)
              setQ('')
              void doCheckIn(family)
            }}
          />
        </Modal>
      )}

      {limitPrompt && (
        <Modal title="Visit limit reached" onClose={() => setLimitPrompt(null)}>
          <p>
            <strong>{limitPrompt.family.display_name}</strong> has already visited{' '}
            {limitPrompt.info.recent_visits} time{limitPrompt.info.recent_visits === 1 ? '' : 's'} in the last{' '}
            {limitPrompt.info.window_days} days (limit: {limitPrompt.info.max_visits}).
          </p>
          <div className="form-actions">
            <button className="btn" onClick={() => setLimitPrompt(null)}>
              Don’t check in
            </button>
            <button className="btn danger" onClick={() => void doCheckIn(limitPrompt.family, true)}>
              Override and check in
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
