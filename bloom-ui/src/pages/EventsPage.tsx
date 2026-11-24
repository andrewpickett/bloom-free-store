import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { useEvents } from '../EventContext'
import { errBanner, formatDate, todayISO, type Msg } from '../util'

export default function EventsPage() {
  const { events, current, setCurrentId, reload } = useEvents()
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO())
  const [capacity, setCapacity] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setMsg({ kind: 'error', text: 'Please give the event a name.' })
      return
    }
    const cap = capacity.trim() === '' ? null : Number(capacity)
    if (cap !== null && (!Number.isInteger(cap) || cap < 1)) {
      setMsg({ kind: 'error', text: 'Capacity must be a whole number, or left blank for no limit.' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const created = await api.createEvent({ name: name.trim(), event_date: date, capacity: cap })
      await reload()
      setCurrentId(created.id)
      setName('')
      setCapacity('')
      setMsg({ kind: 'ok', text: `Created “${created.name}” and made it the current event.` })
    } catch (err) {
      setMsg(errBanner(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-col">
      <section className="card">
        <h2>New shopping day</h2>
        {msg && <div className={`banner ${msg.kind}`}>{msg.text}</div>}
        <form className="form" onSubmit={submit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. December Shopping Day" />
          </label>
          <div className="row">
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label>
              Capacity (families)
              <input
                inputMode="numeric"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="No limit"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create event'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>All events</h2>
        <ul className="list">
          {events.map((ev) => (
            <li key={ev.id} className={ev.id === current?.id ? 'selected' : ''}>
              <div className="grow">
                <strong>{ev.name}</strong>
                <div className="muted">
                  {formatDate(ev.event_date)} · {ev.checkin_count} checked in
                  {ev.capacity != null ? ` of ${ev.capacity}` : ''}
                </div>
              </div>
              {ev.id === current?.id ? (
                <span className="pill ok">Current</span>
              ) : (
                <button className="btn" onClick={() => setCurrentId(ev.id)}>
                  Use this event
                </button>
              )}
            </li>
          ))}
          {events.length === 0 && <li className="empty">No events yet.</li>}
        </ul>
      </section>
    </div>
  )
}
