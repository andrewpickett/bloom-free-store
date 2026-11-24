import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useEvents } from './EventContext'
import { formatDate } from './util'
import CheckInPage from './pages/CheckInPage'
import CheckoutPage from './pages/CheckoutPage'
import EventsPage from './pages/EventsPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  const { events, current, setCurrentId, error } = useEvents()
  const mock = import.meta.env.VITE_USE_MOCK === 'true'

  return (
    <div className="app">
      <header className="topbar">
        <h1>Service Portal</h1>
        <nav>
          <NavLink to="/checkin">Check-in</NavLink>
          <NavLink to="/checkout">Checkout</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </nav>
        <label className="event-picker">
          Event
          <select
            value={current?.id ?? ''}
            onChange={(e) => setCurrentId(Number(e.target.value))}
            disabled={events.length === 0}
          >
            {events.length === 0 && <option value="">No events yet</option>}
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {formatDate(e.event_date)}
              </option>
            ))}
          </select>
        </label>
      </header>

      {mock && <div className="banner warn">Mock mode: sample data only. It resets when you reload.</div>}
      {error && <div className="banner error">Couldn’t load events: {error}</div>}

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/checkin" replace />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  )
}
