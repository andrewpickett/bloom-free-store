import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import type { Checkin, Item } from '../api/types'
import { useEvents } from '../EventContext'
import { categoryLabel, errBanner, formatTime, type Msg } from '../util'

const SIZED = new Set(['diaper', 'pullup'])
const CATEGORY_ORDER = ['diaper', 'pullup', 'clothing', 'hygiene', 'household', 'other']

const categoryRank = (c: string) => {
  const i = CATEGORY_ORDER.indexOf(c)
  return i === -1 ? CATEGORY_ORDER.length : i
}

export default function CheckoutPage() {
  const { current } = useEvents()
  const eventId = current?.id ?? null

  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<number, number>>({})
  const [dirty, setDirty] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null)

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
    setSelectedId(null)
    setQty({})
    setDirty(false)
    void loadCheckins()
  }, [loadCheckins])

  useEffect(() => {
    api.listItems().then(setItems).catch((e) => setMsg(errBanner(e)))
  }, [])

  async function select(c: Checkin) {
    if (c.id === selectedId) return
    if (dirty && !window.confirm('You have unsaved changes for the current family. Discard them?')) return
    setSelectedId(c.id)
    setMsg(null)
    setLoadingDetail(true)
    try {
      const detail = await api.getCheckin(c.id)
      const next: Record<number, number> = {}
      for (const l of detail.lines) next[l.item_id] = l.quantity
      setQty(next)
      setDirty(false)
    } catch (e) {
      setMsg(errBanner(e))
    } finally {
      setLoadingDetail(false)
    }
  }

  const setItemQty = (itemId: number, value: number) => {
    const n = Math.max(0, Math.min(999, Math.floor(Number.isFinite(value) ? value : 0)))
    setQty((q) => ({ ...q, [itemId]: n }))
    setDirty(true)
  }

  async function save() {
    if (selectedId == null) return
    setSaving(true)
    setMsg(null)
    try {
      const lines = Object.entries(qty)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => ({ item_id: Number(id), quantity: n }))
      await api.saveDistributions(selectedId, lines)
      setDirty(false)
      setMsg({ kind: 'ok', text: 'Saved.' })
      await loadCheckins()
    } catch (e) {
      setMsg(errBanner(e))
    } finally {
      setSaving(false)
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const it of items) map.set(it.category, [...(map.get(it.category) ?? []), it])
    return [...map.entries()].sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
  }, [items])

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return checkins.filter((c) => !needle || c.display_name.toLowerCase().includes(needle))
  }, [checkins, filter])

  const selected = checkins.find((c) => c.id === selectedId) ?? null
  const totalItems = Object.values(qty).reduce((a, b) => a + b, 0)
  const diaperCount = items
    .filter((i) => SIZED.has(i.category))
    .reduce((sum, i) => sum + (qty[i.id] ?? 0), 0)

  if (!current) {
    return (
      <div className="card">
        <h2>Checkout</h2>
        <p>There’s no event yet. Create a shopping day on the Events page first.</p>
      </div>
    )
  }

  return (
    <div className="two-col checkout">
      <aside className="card">
        <div className="card-head">
          <h2>Checked-in families</h2>
          <span className="pill">{checkins.length}</span>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Find a family…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <ul className="list">
          {visible.map((c) => (
            <li
              key={c.id}
              className={`clickable ${c.id === selectedId ? 'selected' : ''}`}
              onClick={() => void select(c)}
            >
              <div className="grow">
                <strong>{c.display_name}</strong>
                <div className="muted">In at {formatTime(c.checked_in_at)}</div>
              </div>
              {c.item_count > 0 ? (
                <span className="pill ok">{c.item_count} items</span>
              ) : (
                <span className="pill">not done</span>
              )}
            </li>
          ))}
          {visible.length === 0 && (
            <li className="empty">
              {checkins.length === 0 ? 'No one has checked in yet.' : 'No match.'}
            </li>
          )}
        </ul>
      </aside>

      <section className="card">
        {!selected ? (
          <p className="empty">Select a family on the left to record what they took.</p>
        ) : (
          <>
            <div className="card-head">
              <h2>{selected.display_name}</h2>
              <div className="totals">
                <span className="pill">{totalItems} items</span>
                <span className="pill">{diaperCount} diapers / pull-ups</span>
              </div>
            </div>

            {msg && <div className={`banner ${msg.kind}`}>{msg.text}</div>}

            {loadingDetail ? (
              <p className="muted">Loading…</p>
            ) : (
              groups.map(([category, list]) => (
                <fieldset key={category} className={SIZED.has(category) ? 'sized' : ''}>
                  <legend>{categoryLabel(category)}</legend>
                  <div className="item-grid">
                    {list.map((it) => {
                      const n = qty[it.id] ?? 0
                      return (
                        <div className={`item ${n > 0 ? 'has' : ''}`} key={it.id}>
                          <span className="item-name">
                            {SIZED.has(category) ? `Size ${it.size ?? '—'}` : it.size ? `${it.name} (${it.size})` : it.name}
                          </span>
                          <div className="stepper">
                            <button
                              className="btn"
                              onClick={() => setItemQty(it.id, n - 1)}
                              disabled={n === 0}
                              aria-label={`Remove one ${it.name} ${it.size ?? ''}`}
                            >
                              −
                            </button>
                            <input
                              inputMode="numeric"
                              value={n}
                              onChange={(e) => setItemQty(it.id, Number(e.target.value.replace(/\D/g, '')))}
                              onFocus={(e) => e.target.select()}
                              aria-label={`${it.name} ${it.size ?? ''} quantity`}
                            />
                            <button
                              className="btn"
                              onClick={() => setItemQty(it.id, n + 1)}
                              aria-label={`Add one ${it.name} ${it.size ?? ''}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </fieldset>
              ))
            )}

            <div className="form-actions sticky">
              <button className="btn primary big" onClick={() => void save()} disabled={saving || !dirty}>
                {saving ? 'Saving…' : dirty ? 'Save checkout' : 'Saved'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
