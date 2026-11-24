// In-memory fake backend so the UI can be run and clicked through without the Worker.
// Enabled with `npm run dev:mock`. Data resets on page reload.
import {
  VisitLimitError,
  type Api,
  type Checkin,
  type DistributionLine,
  type EventRow,
  type FamilySummary,
  type Item,
  type Member,
  type Summary,
} from './types'

const delay = <T>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms))
const iso = (d: Date) => d.toLocaleDateString('en-CA')
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const MAX_VISITS = 1
const WINDOW_DAYS = 30

type FamilyRow = { id: number; display_name: string; phone: string | null; members: Member[] }
type CheckinRow = { id: number; event_id: number; family_id: number; checked_in_at: string }

const adults = (n: number): Member[] =>
  Array.from({ length: n }, () => ({ first_name: null, birth_date: null, is_child: false }))

const events: { id: number; name: string; event_date: string; capacity: number | null }[] = [
  { id: 1, name: 'Holiday Shopping Day', event_date: iso(new Date()), capacity: 40 },
  { id: 2, name: 'November Shopping Day', event_date: iso(daysAgo(14)), capacity: 40 },
  { id: 3, name: 'October Shopping Day', event_date: iso(daysAgo(45)), capacity: null },
]

const families: FamilyRow[] = [
  { id: 1, display_name: 'Garcia - Maria', phone: '614-555-0101', members: adults(4) },
  { id: 2, display_name: 'Johnson - Terrence', phone: '614-555-0102', members: adults(3) },
  { id: 3, display_name: 'Nguyen - Linh', phone: '614-555-0103', members: adults(5) },
  { id: 4, display_name: 'Smith - Ashley', phone: null, members: adults(2) },
  { id: 5, display_name: 'Patel - Priya', phone: '614-555-0105', members: adults(4) },
  { id: 6, display_name: 'Williams - Dana', phone: '614-555-0106', members: adults(3) },
  { id: 7, display_name: 'Okafor - Chidi', phone: '614-555-0107', members: adults(6) },
  { id: 8, display_name: 'Miller - Jordan', phone: null, members: adults(1) },
]

const items: Item[] = []
let itemId = 1
for (const s of ['Newborn', '1', '2', '3', '4', '5', '6']) {
  items.push({ id: itemId++, name: 'Diapers', category: 'diaper', size: s })
}
for (const s of ['2T-3T', '3T-4T', '4T-5T']) {
  items.push({ id: itemId++, name: 'Pull-ups', category: 'pullup', size: s })
}
items.push(
  { id: itemId++, name: 'Kids clothing', category: 'clothing', size: null },
  { id: itemId++, name: 'Adult clothing', category: 'clothing', size: null },
  { id: itemId++, name: 'Toiletries', category: 'hygiene', size: null },
  { id: itemId++, name: 'Kitchen & household', category: 'household', size: null },
  { id: itemId++, name: 'Toys & books', category: 'other', size: null },
)
const SIZED = new Set(['diaper', 'pullup'])

const checkins: CheckinRow[] = [
  { id: 1, event_id: 2, family_id: 1, checked_in_at: daysAgo(14).toISOString() },
  { id: 2, event_id: 2, family_id: 2, checked_in_at: daysAgo(14).toISOString() },
  { id: 3, event_id: 2, family_id: 3, checked_in_at: daysAgo(14).toISOString() },
  { id: 4, event_id: 3, family_id: 1, checked_in_at: daysAgo(45).toISOString() },
  { id: 5, event_id: 3, family_id: 4, checked_in_at: daysAgo(45).toISOString() },
  { id: 6, event_id: 3, family_id: 5, checked_in_at: daysAgo(45).toISOString() },
]
const dists = new Map<number, DistributionLine[]>([
  [1, [{ item_id: 4, quantity: 2 }, { item_id: 11, quantity: 6 }]],
  [2, [{ item_id: 5, quantity: 1 }, { item_id: 12, quantity: 3 }]],
  [3, [{ item_id: 9, quantity: 2 }, { item_id: 13, quantity: 4 }]],
  [4, [{ item_id: 3, quantity: 2 }, { item_id: 11, quantity: 5 }]],
  [5, [{ item_id: 8, quantity: 1 }]],
  [6, [{ item_id: 6, quantity: 2 }, { item_id: 14, quantity: 2 }]],
])

let nextFamilyId = 9
let nextEventId = 4
let nextCheckinId = 7

const familyById = (id: number) => families.find((f) => f.id === id)!
const totalQty = (lines: DistributionLine[] | undefined) =>
  (lines ?? []).reduce((sum, l) => sum + l.quantity, 0)

function famSummary(f: FamilyRow): FamilySummary {
  const latest = checkins
    .filter((c) => c.family_id === f.id)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))[0]
  return {
    id: f.id,
    display_name: f.display_name,
    phone: f.phone,
    household_size: f.members.length || 1,
    last_visit: latest ? iso(new Date(latest.checked_in_at)) : null,
  }
}

function toCheckin(c: CheckinRow): Checkin {
  return {
    id: c.id,
    event_id: c.event_id,
    family_id: c.family_id,
    display_name: familyById(c.family_id).display_name,
    checked_in_at: c.checked_in_at,
    item_count: totalQty(dists.get(c.id)),
  }
}

function eventRow(e: (typeof events)[number]): EventRow {
  return { ...e, checkin_count: checkins.filter((c) => c.event_id === e.id).length }
}

export const mockApi: Api = {
  async listEvents() {
    return delay(
      events.map(eventRow).sort((a, b) => b.event_date.localeCompare(a.event_date)),
    )
  },

  async createEvent(input) {
    const e = { id: nextEventId++, ...input }
    events.push(e)
    return delay(eventRow(e))
  },

  async searchFamilies(q) {
    const needle = q.toLowerCase()
    const found = families
      .filter((f) => !needle || f.display_name.toLowerCase().includes(needle) || (f.phone ?? '').includes(needle))
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .slice(0, 50)
      .map(famSummary)
    return delay(found)
  },

  async createFamily(input) {
    const f: FamilyRow = {
      id: nextFamilyId++,
      display_name: input.display_name.trim(),
      phone: input.phone?.trim() || null,
      members: input.members,
    }
    families.push(f)
    return delay(famSummary(f))
  },

  async listCheckins(eventId) {
    const rows = checkins
      .filter((c) => c.event_id === eventId)
      .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
      .map(toCheckin)
    return delay(rows)
  },

  async checkIn(eventId, familyId, override = false) {
    if (checkins.some((c) => c.event_id === eventId && c.family_id === familyId)) {
      throw new Error('This family is already checked in to this event.')
    }
    const cutoff = daysAgo(WINDOW_DAYS).toISOString()
    const recent = checkins.filter((c) => c.family_id === familyId && c.checked_in_at >= cutoff).length
    if (!override && recent >= MAX_VISITS) {
      throw new VisitLimitError({ recent_visits: recent, max_visits: MAX_VISITS, window_days: WINDOW_DAYS })
    }
    const row: CheckinRow = {
      id: nextCheckinId++,
      event_id: eventId,
      family_id: familyId,
      checked_in_at: new Date().toISOString(),
    }
    checkins.push(row)
    return delay(toCheckin(row))
  },

  async listItems() {
    return delay([...items])
  },

  async getCheckin(checkinId) {
    const c = checkins.find((x) => x.id === checkinId)
    if (!c) throw new Error('Check-in not found.')
    return delay({ ...toCheckin(c), lines: [...(dists.get(checkinId) ?? [])] })
  },

  async saveDistributions(checkinId, lines) {
    dists.set(checkinId, lines)
    return delay(undefined)
  },

  async getSummary(start, end): Promise<Summary> {
    const inRange = checkins.filter((c) => {
      const d = iso(new Date(c.checked_in_at)) // local calendar date, not the UTC date
      return d >= start && d <= end
    })
    const itemById = new Map(items.map((i) => [i.id, i]))

    const byItem = new Map<number, number>()
    const byCategory = new Map<string, number>()
    for (const c of inRange) {
      for (const l of dists.get(c.id) ?? []) {
        byItem.set(l.item_id, (byItem.get(l.item_id) ?? 0) + l.quantity)
        const cat = itemById.get(l.item_id)!.category
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + l.quantity)
      }
    }

    const byEvent = events
      .map((e) => {
        const cs = inRange.filter((c) => c.event_id === e.id)
        return {
          event_id: e.id,
          name: e.name,
          event_date: e.event_date,
          families: cs.length,
          items: cs.reduce((sum, c) => sum + totalQty(dists.get(c.id)), 0),
        }
      })
      .filter((e) => e.families > 0)
      .sort((a, b) => b.event_date.localeCompare(a.event_date))

    const sized = [...byItem.entries()]
      .map(([id, total]) => ({ item: itemById.get(id)!, total }))
      .filter((x) => SIZED.has(x.item.category))
      .sort((a, b) => a.item.id - b.item.id)
      .map((x) => ({ category: x.item.category, size: x.item.size, total: x.total }))

    return delay({
      families_served: new Set(inRange.map((c) => c.family_id)).size,
      visits: inRange.length,
      items_total: [...byItem.values()].reduce((a, b) => a + b, 0),
      by_event: byEvent,
      diapers_by_size: sized,
      items_by_category: [...byCategory.entries()]
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => a.category.localeCompare(b.category)),
    })
  },
}
