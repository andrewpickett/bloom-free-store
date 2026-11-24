// Shared types + the API contract the Worker backend must implement.

export interface EventRow {
  id: number
  name: string
  event_date: string // YYYY-MM-DD
  capacity: number | null
  checkin_count: number
}

export interface Member {
  first_name: string | null
  birth_date: string | null // YYYY-MM-DD (or YYYY-MM)
  is_child: boolean
}

export interface FamilySummary {
  id: number
  display_name: string
  phone: string | null
  household_size: number
  last_visit: string | null // YYYY-MM-DD
}

export interface NewFamilyInput {
  display_name: string
  phone?: string
  email?: string
  zip?: string
  notes?: string
  members: Member[]
}

export interface Checkin {
  id: number
  event_id: number
  family_id: number
  display_name: string
  checked_in_at: string // ISO timestamp
  item_count: number // total quantity handed out so far (0 = not checked out yet)
}

export interface Item {
  id: number
  name: string
  category: string // 'diaper' | 'pullup' | 'clothing' | ...
  size: string | null
}

export interface DistributionLine {
  item_id: number
  quantity: number
}

export interface CheckinDetail extends Checkin {
  lines: DistributionLine[]
}

export interface VisitLimitInfo {
  recent_visits: number
  max_visits: number
  window_days: number
}

/** Thrown by checkIn() when the family is over the visit limit and no override was sent. */
export class VisitLimitError extends Error {
  info: VisitLimitInfo
  constructor(info: VisitLimitInfo) {
    super('Visit limit reached')
    this.name = 'VisitLimitError'
    this.info = info
  }
}

export interface Summary {
  families_served: number
  visits: number
  items_total: number
  by_event: { event_id: number; name: string; event_date: string; families: number; items: number }[]
  diapers_by_size: { category: string; size: string | null; total: number }[]
  items_by_category: { category: string; total: number }[]
}

export interface Api {
  listEvents(): Promise<EventRow[]>
  createEvent(input: { name: string; event_date: string; capacity: number | null }): Promise<EventRow>
  searchFamilies(q: string): Promise<FamilySummary[]>
  createFamily(input: NewFamilyInput): Promise<FamilySummary>
  listCheckins(eventId: number): Promise<Checkin[]>
  checkIn(eventId: number, familyId: number, override?: boolean): Promise<Checkin>
  listItems(): Promise<Item[]>
  getCheckin(checkinId: number): Promise<CheckinDetail>
  saveDistributions(checkinId: number, lines: DistributionLine[]): Promise<void>
  getSummary(start: string, end: string): Promise<Summary>
}
