CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  company_name TEXT,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('corporate', 'service', 'individual')),
  business_type TEXT,
  products TEXT[], -- array of products
  scale TEXT,
  province_city TEXT,
  customer_source TEXT,
  staff_in_charge_id BIGINT REFERENCES users(id),
  stage TEXT NOT NULL CHECK (stage IN ('care', 'send_quote', 'consideration', 'purchase')),
  level TEXT NOT NULL CHECK (level IN ('cold', 'warm', 'hot')),
  contact_status TEXT NOT NULL CHECK (contact_status IN ('not_called', 'called', 'following', 'unreachable')),
  customer_feedback TEXT,
  notes TEXT,
  appointment_date TIMESTAMPTZ,
  appointment_reminder TEXT,
  is_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contact_history (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contact_type TEXT NOT NULL,
  notes TEXT,
  staff_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_history (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_history (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (email, name, role) VALUES ('admin@company.com', 'Admin User', 'admin');
