-- Add role column to profiles for feature gating
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'free';

-- Set Josh as admin
UPDATE profiles SET role = 'admin' WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'emailjoshduncan@gmail.com'
);
