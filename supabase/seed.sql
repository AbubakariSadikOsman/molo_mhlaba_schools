-- Real reference data for Molo Mhlaba Behaviour Tracker.
-- Safe to run once after 0001_init.sql. Contains no student or incident data —
-- the roster starts empty and is populated by admins inside the app.

insert into campuses (id, name, short_code, brand_color, sort_order) values
  ('TEN', 'Tennyson Campus',    'TEN', '#ED1C2E', 1),
  ('MAS', 'Masibambane Campus', 'MAS', '#1CA7DB', 2),
  ('NCU', 'Ncumo Campus',       'NCU', '#F7A928', 3)
on conflict (id) do nothing;

insert into behaviour_categories (name, description, example_behaviours, ilp_focus_area, sort_order) values
  ('Emotional Dysregulation', 'Difficulty managing and expressing emotions appropriately for the situation.', 'Crying spells, sudden mood shifts, meltdowns, difficulty calming down', 'Self-regulation / emotional coping skills', 1),
  ('Aggression/Physical', 'Physical actions directed at others, objects, or self.', 'Hitting, biting, pushing, throwing objects, kicking', 'Impulse control / safe hands-and-body strategies', 2),
  ('Social/Peer Conflict', 'Difficulty navigating peer relationships and interactions.', 'Arguing, excluding others, difficulty sharing or taking turns', 'Social skills / peer interaction goals', 3),
  ('Attention/Focus', 'Difficulty sustaining attention or staying on task.', 'Off-task behaviour, frequent distraction, difficulty completing activities', 'Attention span / task persistence', 4),
  ('Withdrawal/Anxiety', 'Avoidance of participation, social withdrawal, or anxious presentation.', 'Isolating from peers, reluctance to participate, visible worry', 'Confidence-building / gradual exposure', 5),
  ('Defiance/Non-compliance', 'Refusal to follow instructions or routines.', 'Refusing instructions, talking back, ignoring redirection', 'Compliance / routine-following strategies', 6),
  ('Sensory Sensitivity', 'Over- or under-reaction to sensory input.', 'Covering ears, avoiding textures, seeking movement or pressure', 'Sensory regulation strategies', 7),
  ('Prosocial/Positive', 'Positive, cooperative behaviour worth reinforcing.', 'Helping peers, sharing, following routines independently', 'Strength-based goal reinforcement', 8)
on conflict (name) do nothing;

insert into ilp_bridge_notes (trend_group, ilp_goal_domain, data_feed_notes) values
  ('Emotional Dysregulation', 'Self-regulation / emotional coping skills', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Aggression/Physical', 'Impulse control / safe hands-and-body strategies', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Social/Peer Conflict', 'Social skills / peer interaction goals', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Attention/Focus', 'Attention span / task persistence', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Withdrawal/Anxiety', 'Confidence-building / gradual exposure', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Defiance/Non-compliance', 'Compliance / routine-following strategies', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Sensory Sensitivity', 'Sensory regulation strategies', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.'),
  ('Prosocial/Positive', 'Strength-based goal reinforcement', 'Individual: incident count, avg severity, trend line. Group: peer list, group avg severity.')
on conflict (trend_group) do nothing;

-- Bootstrap admin: whoever signs up in the app with this email is auto-granted
-- the 'admin' role (access to every campus). Edit/add rows here before other
-- admins create their accounts, or manage this table from the SQL editor later.
insert into bootstrap_admins (email) values
  ('sadik@molomhlaba.org')
on conflict (email) do nothing;
