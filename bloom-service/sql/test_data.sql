INSERT INTO events (name, event_date, start_time, end_time, capacity) VALUES ('New Years Shopping Extravaganza', '2027-01-01', '12:00:00', '15:00:00', 40);
INSERT INTO events (name, event_date, start_time, end_time, capacity) VALUES ('Bloom Buster', '2027-01-15', '12:00:00', '15:00:00', 40);
INSERT INTO events (name, event_date, start_time, end_time, capacity) VALUES ('Valentine''s Day Distribution', '2027-02-14', '12:00:00', '15:00:00', 40);

INSERT INTO item_categories (category, description) VALUES ('diapers', 'Diapers');
INSERT INTO item_categories (category, description) VALUES ('pullups', 'Pull-ups');
INSERT INTO item_categories (category, description) VALUES ('clothing', 'Clothing');
INSERT INTO item_categories (category, description) VALUES ('accessories', 'Accessories');

INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), 'NB');
INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), '1');
INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), '2');
INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), '3');
INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), '4');
INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), '5');
INSERT INTO items (name, category, size) VALUES ('Diaper', (SELECT id FROM item_categories WHERE category = 'diapers'), '6');
INSERT INTO items (name, category, size) VALUES ('Pullup', (SELECT id FROM item_categories WHERE category = 'pullups'), '2T-3T');
INSERT INTO items (name, category, size) VALUES ('Pullup', (SELECT id FROM item_categories WHERE category = 'pullups'), '3T-4T');
INSERT INTO items (name, category, size) VALUES ('Pullup', (SELECT id FROM item_categories WHERE category = 'pullups'), '4T-5T');

INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'New Years Shopping Extravaganza'), (SELECT id FROM item_categories WHERE category = 'diapers'), 5);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'New Years Shopping Extravaganza'), (SELECT id FROM item_categories WHERE category = 'pullups'), 3);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'New Years Shopping Extravaganza'), (SELECT id FROM item_categories WHERE category = 'accessories'), 3);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'Bloom Buster'), (SELECT id FROM item_categories WHERE category = 'diapers'), 15);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'Bloom Buster'), (SELECT id FROM item_categories WHERE category = 'pullups'), 7);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'Bloom Buster'), (SELECT id FROM item_categories WHERE category = 'accessories'), 9);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'Valentine''s Day Distribution'), (SELECT id FROM item_categories WHERE category = 'diapers'), 10);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'Valentine''s Day Distribution'), (SELECT id FROM item_categories WHERE category = 'pullups'), 5);
INSERT INTO event_item_allotment (event_id, itemcategory_id, quantity) VALUES ((SELECT id FROM events WHERE name = 'Valentine''s Day Distribution'), (SELECT id FROM item_categories WHERE category = 'accessories'), 5);

INSERT INTO families (family_name, phone, email, address, zip, notes, active) VALUES ('Pickett', '614-746-0329', 'picketta@gmail.com', '2687 Alum Crossing Dr.', '43035', NULL, 1);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Pickett'), 'Andrew', '1984-07-11', 0);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Pickett'), 'Jennifer', '1984-11-19', 0);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Pickett'), 'Ava', '2014-02-10', 1);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Pickett'), 'Jordan', '2017-05-16', 1);

INSERT INTO families (family_name, phone, email, address, zip, notes, active) VALUES ('Smith', '614-555-1234', 'john.smith@example.com', '123 Main St.', '43125', 'Notes for the Smith family', 1);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Smith'), 'John', '1980-01-01', 0);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Smith'), 'Jane', '1982-05-15', 0);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Smith'), 'Alice', '2015-08-20', 1);

INSERT INTO families (family_name, phone, email, address, zip, notes, active) VALUES ('Johnson', '614-555-5678', 'johnsonfam@example.com', '456 Oak Ave.', '43210', 'Notes for the Johnson family', 1);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Johnson'), 'Michael', '1975-03-10', 0);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Johnson'), 'Sarah', '1978-07-25', 0);
INSERT INTO family_members (family_id, first_name, birth_date, is_child) VALUES ((SELECT id FROM families WHERE family_name = 'Johnson'), 'Jeremiah', '2025-09-07', 1);