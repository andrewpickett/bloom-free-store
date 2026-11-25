-- ---------------------------------------------------------------------------
-- Handy queries (for your Worker code)
-- ---------------------------------------------------------------------------
-- Is this family allowed to check in today? (?1 = family_id)
-- Returns visits in the rolling window; compare against visit_limit.max_visits.
  SELECT COUNT(*) AS recent_visits, (SELECT max_visits FROM visit_limit) AS max_visits
    FROM checkins c
   WHERE c.family_id = ?1
     AND c.checked_in_at >= datetime('now', '-' || (SELECT window_days FROM visit_limit) || ' days');

-- Attendance per event
  SELECT e.name, e.event_date, COUNT(c.id) AS families
    FROM events e LEFT JOIN checkins c ON c.event_id = e.id
GROUP BY e.id 
ORDER BY e.event_date DESC;

-- Diapers / pull-ups given away, by size
  SELECT i.category, i.size, SUM(d.quantity) AS total
    FROM distributions d JOIN items i ON i.id = d.item_id
   WHERE i.category IN ('diaper','pullup')
GROUP BY i.category, i.size ORDER BY i.category, i.size;

-- Distinct families served in a date range (?1 = start, ?2 = end)
SELECT COUNT(DISTINCT family_id) FROM checkins WHERE date(checked_in_at) BETWEEN ?1 AND ?2;