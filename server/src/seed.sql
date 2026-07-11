INSERT INTO categories (name, position) VALUES
  ('Main Lifts', 1),
  ('Accessory Lifts', 2),
  ('Core', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO exercises (category_id, name, is_weighted, position) VALUES
  ((SELECT id FROM categories WHERE name = 'Main Lifts'), 'Barbell Deadlift', true, 1),
  ((SELECT id FROM categories WHERE name = 'Main Lifts'), 'Barbell Squat', true, 2),
  ((SELECT id FROM categories WHERE name = 'Main Lifts'), 'Barbell Shoulder Press', true, 3),
  ((SELECT id FROM categories WHERE name = 'Main Lifts'), 'Dynamic Landmine Lunge Press', true, 4),
  ((SELECT id FROM categories WHERE name = 'Accessory Lifts'), 'Bulgarian Split Squat', true, 1),
  ((SELECT id FROM categories WHERE name = 'Accessory Lifts'), 'Rotational Step Up', true, 2),
  ((SELECT id FROM categories WHERE name = 'Accessory Lifts'), 'Jefferson Curl', true, 3),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Clamshell with Hip Internal Rotation', false, 1),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Plank', false, 2),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Little Bear Shoulder Taps', false, 3),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Upper Trunk Rotation', false, 4),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Side Plank Thread the Needle', false, 5),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Superman', false, 6),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Fire Hydrants', false, 7),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Banded Row w/ Thoracic Rotation', false, 8),
  ((SELECT id FROM categories WHERE name = 'Core'), 'Rotator Cuff Isometric Walkout', false, 9)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, position)
SELECT 'Running', COALESCE(max(position), 0) + 1 FROM categories
ON CONFLICT (name) DO NOTHING;

INSERT INTO exercises (category_id, name, is_run, position) VALUES
  ((SELECT id FROM categories WHERE name = 'Running'), 'Trail Run', true, 1),
  ((SELECT id FROM categories WHERE name = 'Running'), 'Road Run', true, 2),
  ((SELECT id FROM categories WHERE name = 'Running'), 'Workout Run', true, 3)
ON CONFLICT (name) DO NOTHING;
