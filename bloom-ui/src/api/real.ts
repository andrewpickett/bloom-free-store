import { VisitLimitError, type Api, type VisitLimitInfo } from './types'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 409 && data?.error === 'visit_limit') {
      throw new VisitLimitError(data as VisitLimitInfo)
    }
    if (res.status === 409 && data?.error === 'already_checked_in') {
      throw new Error('This family is already checked in to this event.')
    }
    throw new Error(data?.message ?? data?.error ?? `Request failed (${res.status})`)
  }
  return data as T
}

export const realApi: Api = {
  listEvents: () => request('GET', '/events'),
  createEvent: (input) => request('POST', '/events', input),
  searchFamilies: (q) => request('GET', `/families?q=${encodeURIComponent(q)}`),
  createFamily: (input) => request('POST', '/families', input),
  listCheckins: (eventId) => request('GET', `/events/${eventId}/checkins`),
  checkIn: (eventId, familyId, override = false) =>
    request('POST', `/events/${eventId}/checkins`, { family_id: familyId, override }),
  listItems: () => request('GET', '/items'),
  getCheckin: (checkinId) => request('GET', `/checkins/${checkinId}`),
  saveDistributions: (checkinId, lines) =>
    request('PUT', `/checkins/${checkinId}/distributions`, { lines }),
  getSummary: (start, end) =>
    request('GET', `/reports/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
}
