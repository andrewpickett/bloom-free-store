import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Summary } from '../api/types'
import { categoryLabel, daysAgoISO, errBanner, formatDate, todayISO, type Msg } from '../util'

export default function ReportsPage() {
  const [start, setStart] = useState(daysAgoISO(90))
  const [end, setEnd] = useState(todayISO())
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null)

  useEffect(() => {
    if (!start || !end || start > end) return
    let cancelled = false
    setLoading(true)
    setMsg(null)
    api
      .getSummary(start, end)
      .then((s) => {
        if (!cancelled) setData(s)
      })
      .catch((e) => {
        if (!cancelled) setMsg(errBanner(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [start, end])

  const preset = (days: number) => {
    setStart(daysAgoISO(days))
    setEnd(todayISO())
  }
  const thisYear = () => {
    setStart(`${new Date().getFullYear()}-01-01`)
    setEnd(todayISO())
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <h2>Reports</h2>
          <div className="row">
            <button className="btn" onClick={() => preset(30)}>Last 30 days</button>
            <button className="btn" onClick={() => preset(90)}>Last 90 days</button>
            <button className="btn" onClick={thisYear}>This year</button>
          </div>
        </div>
        <div className="row">
          <label>
            From
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        {start > end && <div className="banner error">The start date must be before the end date.</div>}
        {msg && <div className={`banner ${msg.kind}`}>{msg.text}</div>}
      </section>

      {loading && !data && <p className="muted">Loading…</p>}

      {data && (
        <>
          <div className="stats">
            <div className="stat">
              <span className="stat-num">{data.families_served}</span>
              <span className="stat-label">Families served</span>
            </div>
            <div className="stat">
              <span className="stat-num">{data.visits}</span>
              <span className="stat-label">Total visits</span>
            </div>
            <div className="stat">
              <span className="stat-num">{data.items_total}</span>
              <span className="stat-label">Items given away</span>
            </div>
          </div>

          <div className="two-col">
            <section className="card">
              <h2>Diapers & pull-ups by size</h2>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Size</th>
                    <th className="num">Given</th>
                  </tr>
                </thead>
                <tbody>
                  {data.diapers_by_size.map((r) => (
                    <tr key={`${r.category}-${r.size}`}>
                      <td>{categoryLabel(r.category)}</td>
                      <td>{r.size ?? '—'}</td>
                      <td className="num">{r.total}</td>
                    </tr>
                  ))}
                  {data.diapers_by_size.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">None in this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="card">
              <h2>Items by category</h2>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num">Given</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items_by_category.map((r) => (
                    <tr key={r.category}>
                      <td>{categoryLabel(r.category)}</td>
                      <td className="num">{r.total}</td>
                    </tr>
                  ))}
                  {data.items_by_category.length === 0 && (
                    <tr>
                      <td colSpan={2} className="empty">None in this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>

          <section className="card">
            <h2>By event</h2>
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th className="num">Families</th>
                  <th className="num">Items</th>
                </tr>
              </thead>
              <tbody>
                {data.by_event.map((r) => (
                  <tr key={r.event_id}>
                    <td>{r.name}</td>
                    <td>{formatDate(r.event_date)}</td>
                    <td className="num">{r.families}</td>
                    <td className="num">{r.items}</td>
                  </tr>
                ))}
                {data.by_event.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">No events in this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
