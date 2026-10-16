-- ILM Supabase SQL schema
-- Run this inside Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  assigned_class TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  password_hash TEXT,
  password_plain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  admin_email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  admission_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_code TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  bio TEXT,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_officers (
  id SERIAL PRIMARY KEY,
  class_code TEXT NOT NULL,
  role_title TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  admission_no TEXT,
  photo_url TEXT NOT NULL,
  responsibilities TEXT,
  updated_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  max_participants_per_class INTEGER NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  admission_no TEXT,
  full_name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  class_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  own_topic TEXT,
  short_description TEXT,
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posters (
  id SERIAL PRIMARY KEY,
  class_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  poster_image_url TEXT NOT NULL,
  participants_snapshot TEXT NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  generation_status TEXT NOT NULL DEFAULT 'COMPLETED',
  generation_error TEXT,
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_posts (
  id SERIAL PRIMARY KEY,
  class_code TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'PHOTO',
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  submitted_by_email TEXT NOT NULL,
  submitted_by_name TEXT NOT NULL,
  reviewed_by_email TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_results (
  id SERIAL PRIMARY KEY,
  result_category TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  winner_photo_url TEXT NOT NULL,
  winner_class TEXT NOT NULL,
  week_label TEXT NOT NULL,
  result_date TEXT NOT NULL,
  remarks TEXT,
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
  published_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  library_scope TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  content_preview TEXT,
  publication_status TEXT NOT NULL DEFAULT 'PUBLISHED',
  uploaded_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  class_code TEXT,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed classes
INSERT INTO classes (code, name, description)
VALUES
  ('U1', 'Class U1 — Foundation Cohort', 'Foundation cohort for new learners.'),
  ('U2', 'Class U2 — Emerging Orators', 'Developing confident public speakers.'),
  ('U3', 'Class U3 — Intermediate Scholars', 'Intermediate skill building and evaluation.'),
  ('U4', 'Class U4 — Senior Debaters', 'Advanced debate and presentation skills.'),
  ('U5', 'Class U5 — Honors Fellowship', 'Leadership and advanced competition training.'),
  ('U6', 'Class U6 — Master Laureates', 'Capstone leadership and excellence.')
ON CONFLICT (code) DO NOTHING;

-- Seed competition categories
INSERT INTO competition_categories (name, max_participants_per_class, description, display_order)
VALUES
  ('Qirat', 1, 'Recitation and vocal excellence.', 1),
  ('Naat', 5, 'Naat recitation and expression.', 2),
  ('Speech', 5, 'Prepared speech and delivery.', 3),
  ('Table Topic', 5, 'Impromptu speaking and strategy.', 4),
  ('Aah Counter', 1, 'Evaluation and analysis.', 5),
  ('Evolution', 5, 'Growth and progress tracking.', 6),
  ('Marshal', 1, 'Order, discipline, and structure.', 7),
  ('Grammarian', 1, 'Language precision and correction.', 8)
ON CONFLICT (name) DO NOTHING;

-- Important: allow the app to read/write without RLS blocking
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE competition_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE posters DISABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE library_resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- Optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_class ON users(role, assigned_class);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_code);
CREATE INDEX IF NOT EXISTS idx_participants_class_category ON participants(class_code, category_name);
CREATE INDEX IF NOT EXISTS idx_feed_posts_status ON feed_posts(status);
CREATE INDEX IF NOT EXISTS idx_library_scope ON library_resources(library_scope);
