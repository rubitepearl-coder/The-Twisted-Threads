-- Create addons table for letters, premium wrappers, greeting cards
CREATE TABLE addons (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  description text DEFAULT '' NOT NULL,
  type text DEFAULT 'addon' NOT NULL, -- 'letter' | 'wrapper' | 'card' | 'other'
  price real NOT NULL,
  imageUrl text DEFAULT '',
  inStock integer DEFAULT 1 NOT NULL,
  created_at integer,
  updated_at integer
);