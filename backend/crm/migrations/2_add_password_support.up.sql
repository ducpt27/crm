-- Add password and username fields to users table
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Update existing admin user with default credentials
-- Password 'admin123' hashed with SHA256
UPDATE users SET 
  username = 'admin',
  password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
WHERE email = 'admin@company.com' AND username IS NULL;

-- Make username and password_hash required for new records by adding constraints
ALTER TABLE users ADD CONSTRAINT users_username_not_null CHECK (username IS NOT NULL);
ALTER TABLE users ADD CONSTRAINT users_password_hash_not_null CHECK (password_hash IS NOT NULL);

-- Add unique constraint for username
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
