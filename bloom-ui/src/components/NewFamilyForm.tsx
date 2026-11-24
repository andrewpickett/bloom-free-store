import { useState, type FormEvent } from 'react'
import { api } from '../api'
import type { FamilySummary, Member } from '../api/types'
import { errMsg } from '../util'

interface Props {
  onCreated: (family: FamilySummary) => void
  onCancel: () => void
}

const blankMember = (is_child: boolean): Member => ({ first_name: '', birth_date: '', is_child })

export default function NewFamilyForm({ onCreated, onCancel }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [zip, setZip] = useState('')
  const [notes, setNotes] = useState('')
  const [members, setMembers] = useState<Member[]>([blankMember(false)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateMember = (i: number, patch: Partial<Member>) =>
    setMembers((ms) => ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Please enter a family name.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const family = await api.createFamily({
        display_name: displayName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        zip: zip.trim() || undefined,
        notes: notes.trim() || undefined,
        members: members.map((m) => ({
          first_name: m.first_name?.trim() || null,
          birth_date: m.birth_date || null,
          is_child: m.is_child,
        })),
      })
      onCreated(family)
    } catch (err) {
      setError(errMsg(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="form">
      {error && <div className="banner error">{error}</div>}

      <label>
        Family name <span className="req">*</span>
        <input
          autoFocus
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Last name - First name (e.g. Garcia - Maria)"
        />
      </label>

      <div className="row">
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
        </label>
        <label className="narrow">
          ZIP
          <input value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" maxLength={10} />
        </label>
      </div>

      <fieldset>
        <legend>Household members</legend>
        {members.map((m, i) => (
          <div className="row member-row" key={i}>
            <span className={`tag ${m.is_child ? 'child' : ''}`}>{m.is_child ? 'Child' : 'Adult'}</span>
            <input
              placeholder="First name (optional)"
              value={m.first_name ?? ''}
              onChange={(e) => updateMember(i, { first_name: e.target.value })}
            />
            <input
              type="date"
              title="Birth date (helps with diaper sizing)"
              value={m.birth_date ?? ''}
              onChange={(e) => updateMember(i, { birth_date: e.target.value })}
            />
            <button
              type="button"
              className="btn ghost"
              onClick={() => setMembers((ms) => ms.filter((_, idx) => idx !== i))}
              aria-label="Remove member"
            >
              ✕
            </button>
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn" onClick={() => setMembers((ms) => [...ms, blankMember(false)])}>
            + Adult
          </button>
          <button type="button" className="btn" onClick={() => setMembers((ms) => [...ms, blankMember(true)])}>
            + Child
          </button>
        </div>
      </fieldset>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : 'Register & check in'}
        </button>
      </div>
    </form>
  )
}
