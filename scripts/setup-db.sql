-- Run this in your Neon SQL editor to set up the database

CREATE TABLE IF NOT EXISTS verified_students (
  id SERIAL PRIMARY KEY,
  purchase_email VARCHAR(255) NOT NULL UNIQUE,
  student_email VARCHAR(255) NOT NULL,
  verified_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_verifications (
  id SERIAL PRIMARY KEY,
  purchase_email VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  order_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  shopify_order_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'on_hold',
  reminded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_verified_email ON verified_students(purchase_email);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_pending_token ON pending_verifications(token);
