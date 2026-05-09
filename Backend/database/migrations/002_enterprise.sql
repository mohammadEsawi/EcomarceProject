-- ============================================================================
-- MIGRATION 002: Enterprise Platform Upgrade
-- Adds brands, banners, settings, shipping_addresses, coupon_usage,
-- activity_logs, audit_logs, enhanced product fields, and more.
-- ============================================================================

-- ─── BRANDS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  logo_url    TEXT,
  description TEXT,
  website_url TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ENHANCE PRODUCTS ────────────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_id          INT REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sku               VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS barcode           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS material          VARCHAR(200),
  ADD COLUMN IF NOT EXISTS gender            VARCHAR(20) CHECK (gender IN ('men','women','unisex','kids')),
  ADD COLUMN IF NOT EXISTS seasonal_tag      VARCHAR(30),
  ADD COLUMN IF NOT EXISTS meta_title        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS meta_description  VARCHAR(500),
  ADD COLUMN IF NOT EXISTS meta_keywords     VARCHAR(300),
  ADD COLUMN IF NOT EXISTS is_trending       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_new            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT,
  ADD COLUMN IF NOT EXISTS weight_grams      INT,
  ADD COLUMN IF NOT EXISTS tags              TEXT[],
  ADD COLUMN IF NOT EXISTS view_count        INT NOT NULL DEFAULT 0;

-- ─── ENHANCE USERS ───────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth       DATE,
  ADD COLUMN IF NOT EXISTS gender              VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login_at       TIMESTAMPTZ;

-- ─── BANNERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  subtitle     VARCHAR(300),
  cta_text     VARCHAR(80),
  cta_url      TEXT,
  image_url    TEXT NOT NULL,
  position     VARCHAR(30) NOT NULL DEFAULT 'hero' CHECK (position IN ('hero','mid','sidebar','popup')),
  display_order INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SITE SETTINGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  value_json  JSONB,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value, description) VALUES
  ('store_name',         'Murad & Sabah Store', 'Display name of the store'),
  ('store_currency',     'USD',                 'Default currency code'),
  ('store_currency_sym', '$',                   'Currency symbol'),
  ('tax_rate',           '0',                   'Tax rate as a percentage'),
  ('free_shipping_min',  '100',                 'Minimum order for free shipping in currency units'),
  ('default_shipping',   '10',                  'Default shipping cost'),
  ('low_stock_threshold','5',                   'Default low-stock warning threshold'),
  ('maintenance_mode',   'false',               'Put site in maintenance mode'),
  ('store_email',        'support@muradsabahstore.ps', 'Public support email'),
  ('store_phone',        '+970 598-032-500',    'Public contact phone')
ON CONFLICT (key) DO NOTHING;

-- ─── SHIPPING ADDRESSES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        VARCHAR(60) NOT NULL DEFAULT 'Home',
  full_name    VARCHAR(150) NOT NULL,
  phone        VARCHAR(30),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100),
  postal_code  VARCHAR(20),
  country      VARCHAR(100) NOT NULL DEFAULT 'Palestine',
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COUPON USAGE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_usage (
  id         SERIAL PRIMARY KEY,
  coupon_id  INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   INT REFERENCES orders(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  admin_id    INT REFERENCES admins(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60),
  entity_id   INT,
  meta        JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  admin_id    INT REFERENCES admins(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(80) NOT NULL,
  record_id   INT,
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCT RECENTLY VIEWED ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recently_viewed (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ─── FEATURED PRODUCTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS featured_sections (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  slug        VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS featured_section_products (
  section_id   INT NOT NULL REFERENCES featured_sections(id) ON DELETE CASCADE,
  product_id   INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, product_id)
);

-- ─── REVIEW IMAGES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_images (
  id         SERIAL PRIMARY KEY,
  review_id  INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_brand_id    ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_gender      ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON products(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_new      ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_tags        ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_view_count  ON products(view_count DESC);

CREATE INDEX IF NOT EXISTS idx_banners_position     ON banners(position) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_banners_active       ON banners(is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id     ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id       ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id      ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action       ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at   ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id        ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id    ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at  ON recently_viewed(viewed_at DESC);

-- ─── TRIGGER: auto-update shipping_addresses.updated_at ──────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER trg_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ─── FUNCTION: log activity ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_log_activity(
  p_user_id     INT,
  p_admin_id    INT,
  p_action      VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id   INT,
  p_meta        JSONB DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO activity_logs (user_id, admin_id, action, entity_type, entity_id, meta)
  VALUES (p_user_id, p_admin_id, p_action, p_entity_type, p_entity_id, p_meta);
END;
$$;

-- ─── FUNCTION: upsert recently viewed ────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_upsert_recently_viewed(p_user_id INT, p_product_id INT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO recently_viewed (user_id, product_id, viewed_at)
  VALUES (p_user_id, p_product_id, NOW())
  ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = NOW();
  -- Increment view count
  UPDATE products SET view_count = view_count + 1 WHERE id = p_product_id;
END;
$$;

-- ─── DEFAULT FEATURED SECTIONS ────────────────────────────────────────────────
INSERT INTO featured_sections (title, slug, description, display_order) VALUES
  ('New Arrivals',    'new-arrivals',    'Freshest items in stock',         1),
  ('Best Sellers',    'best-sellers',    'Our most popular items',          2),
  ('Trending Now',    'trending-now',    'What everyone is wearing',        3),
  ('On Sale',         'on-sale',         'Limited-time discounts',          4)
ON CONFLICT (slug) DO NOTHING;
