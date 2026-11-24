import { useEffect, useState } from 'react'

export type Msg = { kind: 'ok' | 'error'; text: string }

export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))
export const errBanner = (e: unknown): Msg => ({ kind: 'error', text: errMsg(e) })

export const todayISO = (): string => new Date().toLocaleDateString('en-CA')

export const daysAgoISO = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toLocaleDateString('en-CA')
}

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const formatDate = (isoDate: string): string => {
  // Parse YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC and can shift a day).
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export const CATEGORY_LABEL: Record<string, string> = {
  diaper: 'Diapers',
  pullup: 'Pull-ups',
  clothing: 'Clothing',
  hygiene: 'Hygiene',
  household: 'Household',
  other: 'Other',
}
export const categoryLabel = (c: string): string =>
  CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1)
