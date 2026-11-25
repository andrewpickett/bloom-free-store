-- Bloom Free Store: schema for Cloudflare D1 (SQLite)
-- Dates are ISO-8601 text (YYYY-MM-DD, or full timestamps in UTC).
-- STRICT tables make SQLite enforce column types.
-- D1 enforces foreign keys by default.

-- Rebuild the database with:
--   DROP TABLE IF EXISTS checkins;
--   DROP TABLE IF EXISTS family_members;
--   DROP TABLE IF EXISTS families;
--   DROP TABLE IF EXISTS event_item_allotment;
--   DROP TABLE IF EXISTS events;
--   DROP TABLE IF EXISTS items;
--   DROP TABLE IF EXISTS item_categories;
--   DROP TABLE IF EXISTS distributions;
--   DROP TABLE IF EXISTS visit_limit;
--   DROP TABLE IF EXISTS registrations;
--   DROP TABLE IF EXISTS bloom_user;

CREATE TABLE bloom_user (
  id          INTEGER PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  is_admin    INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0,1)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

-- ----------------------------------------------------------------------------------------------
-- Shopping days / events
--    event_date is required in either 'YYYY-MM-DDTHH:MM:SS.SSSZ' (UTC) or 'YYYY-MM-DD' (local)
--    name is optional, e.g. "Saturday Diaper Distribution"
--    capacity is NULL for no cap.
-- ----------------------------------------------------------------------------------------------
CREATE TABLE events (
  id          INTEGER PRIMARY KEY,
  event_date  TEXT NOT NULL,
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  name        TEXT,
  capacity    INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
CREATE INDEX idx_events_date ON events(event_date);

-- ----------------------------------------------------------------------------------------------
-- Item allotments for events
--    event_id is a foreign key to the events table
--    itemcategory_id is a foreign key to the item_categories table
--    quantity is the number of items allotted for the event
-- ----------------------------------------------------------------------------------------------
CREATE TABLE event_item_allotment (
  id                INTEGER PRIMARY KEY,
  event_id          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  itemcategory_id   INTEGER NOT NULL REFERENCES item_categories(id),
  quantity          INTEGER NOT NULL CHECK (quantity >= 0),
  UNIQUE (event_id, itemcategory_id)
) STRICT;

-- ----------------------------------------------------------------------------------------------
-- Families / households
--    family_name is required
--    phone is required
--    email is required
--    address is required
--    zip is required
--    notes is optional
-- NOTES: There must be at least 1 adult family member per household. The family_members table tracks the individual members of the household.
-- Active is a boolean (0 or 1) indicating whether the family is currently active in the system. Inactive families are not allowed to check in for events.
-- ----------------------------------------------------------------------------------------------
CREATE TABLE families (
  id            INTEGER PRIMARY KEY,
  family_name   TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  address       TEXT NOT NULL,
  zip           TEXT NOT NULL,
  notes         TEXT,
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
CREATE INDEX idx_families_name ON families(family_name COLLATE NOCASE);
CREATE INDEX idx_families_phone ON families(phone);

-- ----------------------------------------------------------------------------------------------
-- Family Members
--    family_id is a foreign key to the families table
--    first_name is the first name of the family member
--    birth_date is the birth date of the family member 'YYYY-MM-DD' or just 'YYYY-MM'; NULL if unknown
--    is_child is a boolean indicating whether the family member is a child
-- ----------------------------------------------------------------------------------------------
CREATE TABLE family_members (
  id          INTEGER PRIMARY KEY,
  family_id   INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name  TEXT,
  birth_date  TEXT,
  is_child    INTEGER NOT NULL DEFAULT 0 CHECK (is_child IN (0,1))
) STRICT;
CREATE INDEX idx_members_family ON family_members(family_id);

-- ----------------------------------------------------------------------------------------------
-- Check-ins: one row per family per event. UNIQUE stops double check-ins.
--    event_id is a foreign key to the events table
--    family_id is a foreign key to the families table
-- ----------------------------------------------------------------------------------------------
CREATE TABLE checkins (
  id             INTEGER PRIMARY KEY,
  event_id       INTEGER NOT NULL REFERENCES events(id),
  family_id      INTEGER NOT NULL REFERENCES families(id),
  checked_in_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, family_id)
) STRICT;
CREATE INDEX idx_checkins_family ON checkins(family_id, checked_in_at);

-- ----------------------------------------------------------------------------------------------
-- Item catalog to track what we have on hand and what we give away.
--   name is the display name of the item (e.g. "Diapers", "Pull-ups", "Winter coat")
--   category is a short string to group items (e.g. "diaper", "pullup", "clothing", "household")
--   size is a short string to indicate the size of the item (e.g. "Newborn", "1", "2", ..., "5T-6T"); NULL if n/a
-- ----------------------------------------------------------------------------------------------
CREATE TABLE items (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  category  INTEGER NOT NULL REFERENCES item_categories(id),
  size      TEXT,
  active    INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  UNIQUE (name, size)
) STRICT;

-- ----------------------------------------------------------------------------------------------
-- Item categories to group items in the catalog. Each item belongs to one category.
-- ----------------------------------------------------------------------------------------------
CREATE TABLE item_categories (
  id INTEGER PRIMARY KEY,
  category  TEXT NOT NULL UNIQUE,
  description TEXT
) STRICT;

-- ----------------------------------------------------------------------------------------------
-- Distributions: one row per item per check-in. Tracks what was given to each family at each event.
-- ----------------------------------------------------------------------------------------------
CREATE TABLE distributions (
  id          INTEGER PRIMARY KEY,
  checkin_id  INTEGER NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
CREATE INDEX idx_dist_checkin ON distributions(checkin_id);
CREATE INDEX idx_dist_item ON distributions(item_id);

-- ----------------------------------------------------------------------------------------------
-- Visit limits: one row only, to track how many visits a family can make in a rolling window of time.
-- ----------------------------------------------------------------------------------------------
CREATE TABLE visit_limit (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  max_visits    INTEGER NOT NULL,
  window_days   INTEGER NOT NULL
) STRICT;
INSERT INTO visit_limit (id, max_visits, window_days) VALUES (1, 1, 30);  -- placeholder: 1 per 30 days

-- ----------------------------------------------------------------------------------------------
-- Registrations: one row per family per event. Tracks which families are registered for which events.
-- ----------------------------------------------------------------------------------------------
CREATE TABLE registrations (
  id          INTEGER PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id),
  family_id   INTEGER NOT NULL REFERENCES families(id),
  status      TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','cancelled','waitlist')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, family_id)
) STRICT;