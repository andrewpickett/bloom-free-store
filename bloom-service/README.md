# Free Store – staff front end

React + TypeScript (Vite) app for free store staff. There are no family logins: staff run check-in and checkout.

## Run it

```bash
npm install
npm run dev:mock   # works right now, with in-memory sample data (resets on reload)
npm run dev        # talks to the real API; /api is proxied to `wrangler dev` on :8787
npm run build      # type-check + production build into dist/
```

## Pages

| Route       | What it does |
|-------------|--------------|
| `/checkin`  | Search families, check one in, register a new family (and check them in). Warns when the visit limit is hit; staff can override. |
| `/checkout` | Pick a checked-in family, enter quantities per item. Diapers and pull-ups are shown per size and counted separately. |
| `/events`   | Create shopping days (optional capacity) and choose the current event. |
| `/reports`  | Families served, visits, items given away, diapers/pull-ups by size, and a per-event table for a date range. |

The event picker in the header sets the "current event" for check-in and checkout. It is remembered in the browser.

## Where things are

- `src/api/types.ts` – types and the `Api` interface (the contract)
- `src/api/real.ts` – `fetch` calls to `/api/...`
- `src/api/mock.ts` – fake backend used by `npm run dev:mock`
- `src/pages/` – the four pages; `src/components/` – modal and new-family form

## API the Worker needs to implement

All JSON. Errors: non-2xx with `{ "error": "...", "message": "..." }`.

| Method & path | Body / query | Returns |
|---|---|---|
| `GET /api/events` | | `EventRow[]` (include `checkin_count`) |
| `POST /api/events` | `{name, event_date, capacity}` | `EventRow` |
| `GET /api/families?q=` | `q` matches name or phone, max ~50 rows, sorted by name | `FamilySummary[]` |
| `POST /api/families` | `NewFamilyInput` (creates family + members) | `FamilySummary` |
| `GET /api/events/:id/checkins` | | `Checkin[]` (include `display_name`, `item_count`) |
| `POST /api/events/:id/checkins` | `{family_id, override}` | `Checkin` |
| `GET /api/items` | active items only | `Item[]` |
| `GET /api/checkins/:id` | | `CheckinDetail` (`Checkin` + `lines`) |
| `PUT /api/checkins/:id/distributions` | `{lines: [{item_id, quantity}]}` replaces all lines | 204 |
| `GET /api/reports/summary?start=&end=` | dates `YYYY-MM-DD` | `Summary` |

Two error shapes the UI depends on, both with HTTP 409:

- **Visit limit:** `{ "error": "visit_limit", "recent_visits": 1, "max_visits": 1, "window_days": 30 }`. Return this when the family is over the limit and `override` is not `true`. Then the UI asks staff whether to override.
- **Double check-in:** `{ "error": "already_checked_in" }` (the `UNIQUE (event_id, family_id)` constraint).

Exact field names and shapes are in `src/api/types.ts`.

## Notes

- **Time zones:** D1's `datetime('now')` is UTC, so an evening check-in in Ohio has *tomorrow's* UTC date. When the Worker buckets by date (reports, `last_visit`, the visit-limit window), convert to the store's local time first. Otherwise evening visits fall outside "through today" ranges. `event_date` is already a plain local date.

- Items (including one row per diaper/pull-up size) come from the `items` table, so changing what's offered is a data change, not a code change. Category names `diaper` and `pullup` get the per-size layout.
- Put the whole site (pages and `/api`) behind authentication, e.g. Cloudflare Access, since it exposes family data.
- To deploy on Cloudflare Pages, build with `npm run build` and publish `dist/`. Add a catch-all redirect to `index.html` so client-side routes work on refresh.
