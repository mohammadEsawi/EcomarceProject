-- =============================================================================
-- PostgreSQL Schema for Clothing Store E-Commerce
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- DROP EXISTING OBJECTS (safe re-run)
-- =============================================================================

DROP TRIGGER IF EXISTS trg_update_product_status    ON inventory;
DROP TRIGGER IF EXISTS trg_create_stock_alert        ON inventory;
DROP TRIGGER IF EXISTS trg_set_users_updated_at      ON users;
DROP TRIGGER IF EXISTS trg_set_products_updated_at   ON products;
DROP TRIGGER IF EXISTS trg_set_orders_updated_at     ON orders;
DROP TRIGGER IF EXISTS trg_set_cart_items_updated_at ON cart_items;
DROP TRIGGER IF EXISTS trg_set_reviews_updated_at    ON reviews;

DROP FUNCTION IF EXISTS fn_update_product_status()     CASCADE;
DROP FUNCTION IF EXISTS fn_create_stock_alert()        CASCADE;
DROP FUNCTION IF EXISTS fn_set_updated_at()            CASCADE;
DROP FUNCTION IF EXISTS fn_get_product_total_stock(BIGINT) CASCADE;

DROP TABLE IF EXISTS notifications   CASCADE;
DROP TABLE IF EXISTS stock_alerts    CASCADE;
DROP TABLE IF EXISTS coupons         CASCADE;
DROP TABLE IF EXISTS reviews         CASCADE;
DROP TABLE IF EXISTS wishlist        CASCADE;
DROP TABLE IF EXISTS cart_items      CASCADE;
DROP TABLE IF EXISTS carts           CASCADE;
DROP TABLE IF EXISTS order_items     CASCADE;
DROP TABLE IF EXISTS orders          CASCADE;
DROP TABLE IF EXISTS inventory       CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS sizes           CASCADE;
DROP TABLE IF EXISTS colors          CASCADE;
DROP TABLE IF EXISTS product_images  CASCADE;
DROP TABLE IF EXISTS products        CASCADE;
DROP TABLE IF EXISTS categories      CASCADE;
DROP TABLE IF EXISTS admins          CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role           AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status        AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE product_status      AS ENUM ('available', 'low_stock', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE discount_type       AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE alert_type          AS ENUM ('low_stock', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type   AS ENUM ('order', 'promo', 'system', 'review', 'stock');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id           BIGSERIAL        PRIMARY KEY,
    name         VARCHAR(100)     NOT NULL,
    email        VARCHAR(255)     NOT NULL UNIQUE,
    password_hash TEXT            NOT NULL,
    phone        VARCHAR(30),
    role         user_role        NOT NULL DEFAULT 'customer',
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- admins
-- -----------------------------------------------------------------------------
CREATE TABLE admins (
    id            BIGSERIAL   PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url   TEXT,
    parent_id   BIGINT       REFERENCES categories(id) ON DELETE SET NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    slug            VARCHAR(220)    NOT NULL UNIQUE,
    description     TEXT,
    price           NUMERIC(10, 2)  NOT NULL CHECK (price > 0),
    discount_price  NUMERIC(10, 2)  CHECK (discount_price > 0 AND discount_price < price),
    category_id     BIGINT          NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    is_featured     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_visible      BOOLEAN         NOT NULL DEFAULT TRUE,
    status          product_status  NOT NULL DEFAULT 'available',
    main_image_url  TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- product_images
-- -----------------------------------------------------------------------------
CREATE TABLE product_images (
    id            BIGSERIAL   PRIMARY KEY,
    product_id    BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url     TEXT        NOT NULL,
    display_order SMALLINT    NOT NULL DEFAULT 0,
    is_main       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- colors
-- -----------------------------------------------------------------------------
CREATE TABLE colors (
    id         BIGSERIAL   PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    hex_code   CHAR(7)     NOT NULL CHECK (hex_code ~ '^#[0-9A-Fa-f]{6}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- sizes
-- -----------------------------------------------------------------------------
CREATE TABLE sizes (
    id            BIGSERIAL   PRIMARY KEY,
    name          VARCHAR(20) NOT NULL UNIQUE,
    display_order SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- product_variants
-- -----------------------------------------------------------------------------
CREATE TABLE product_variants (
    id         BIGSERIAL   PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    color_id   BIGINT      NOT NULL REFERENCES colors(id)    ON DELETE RESTRICT,
    size_id    BIGINT      NOT NULL REFERENCES sizes(id)     ON DELETE RESTRICT,
    sku        VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, color_id, size_id)
);

-- -----------------------------------------------------------------------------
-- inventory
-- -----------------------------------------------------------------------------
CREATE TABLE inventory (
    id                  BIGSERIAL      PRIMARY KEY,
    variant_id          BIGINT         NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity            INT            NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INT            NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (variant_id)
);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id               BIGSERIAL      PRIMARY KEY,
    user_id          BIGINT         REFERENCES users(id) ON DELETE SET NULL,
    status           order_status   NOT NULL DEFAULT 'pending',
    total_amount     NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    coupon_code      VARCHAR(50),
    shipping_address JSONB          NOT NULL DEFAULT '{}',
    payment_method   VARCHAR(60),
    notes            TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id           BIGSERIAL      PRIMARY KEY,
    order_id     BIGINT         NOT NULL REFERENCES orders(id)          ON DELETE CASCADE,
    variant_id   BIGINT         REFERENCES product_variants(id)         ON DELETE SET NULL,
    product_id   BIGINT         REFERENCES products(id)                 ON DELETE SET NULL,
    quantity     INT            NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    color_name   VARCHAR(50),
    size_name    VARCHAR(20),
    product_name VARCHAR(200),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- carts
-- -----------------------------------------------------------------------------
CREATE TABLE carts (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- -----------------------------------------------------------------------------
-- cart_items
-- -----------------------------------------------------------------------------
CREATE TABLE cart_items (
    id         BIGSERIAL   PRIMARY KEY,
    cart_id    BIGINT      NOT NULL REFERENCES carts(id)            ON DELETE CASCADE,
    variant_id BIGINT      NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id BIGINT      REFERENCES products(id)                  ON DELETE SET NULL,
    quantity   INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

-- -----------------------------------------------------------------------------
-- wishlist
-- -----------------------------------------------------------------------------
CREATE TABLE wishlist (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id            BIGSERIAL   PRIMARY KEY,
    product_id    BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id       BIGINT      REFERENCES users(id)             ON DELETE SET NULL,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         VARCHAR(150),
    body          TEXT,
    is_visible    BOOLEAN     NOT NULL DEFAULT TRUE,
    helpful_count INT         NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- coupons
-- -----------------------------------------------------------------------------
CREATE TABLE coupons (
    id                 BIGSERIAL      PRIMARY KEY,
    code               VARCHAR(50)    NOT NULL UNIQUE,
    discount_type      discount_type  NOT NULL,
    discount_value     NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    max_uses           INT            CHECK (max_uses > 0),
    used_count         INT            NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    is_active          BOOLEAN        NOT NULL DEFAULT TRUE,
    expires_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_percentage_max CHECK (
        discount_type <> 'percentage' OR discount_value <= 100
    )
);

-- -----------------------------------------------------------------------------
-- stock_alerts
-- -----------------------------------------------------------------------------
CREATE TABLE stock_alerts (
    id          BIGSERIAL   PRIMARY KEY,
    variant_id  BIGINT      NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id  BIGINT      REFERENCES products(id)                  ON DELETE SET NULL,
    alert_type  alert_type  NOT NULL,
    is_resolved BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id         BIGSERIAL          PRIMARY KEY,
    user_id    BIGINT             REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(200)       NOT NULL,
    message    TEXT               NOT NULL,
    type       notification_type  NOT NULL DEFAULT 'system',
    is_read    BOOLEAN            NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- products
CREATE INDEX idx_products_category_id  ON products (category_id);
CREATE INDEX idx_products_status       ON products (status);
CREATE INDEX idx_products_is_featured  ON products (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_is_visible   ON products (is_visible)  WHERE is_visible  = TRUE;
CREATE INDEX idx_products_price        ON products (price);
CREATE INDEX idx_products_slug         ON products (slug);

-- product_images
CREATE INDEX idx_product_images_product_id ON product_images (product_id);

-- product_variants
CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_product_variants_color_id   ON product_variants (color_id);
CREATE INDEX idx_product_variants_size_id    ON product_variants (size_id);

-- inventory
CREATE INDEX idx_inventory_variant_id ON inventory (variant_id);
CREATE INDEX idx_inventory_quantity   ON inventory (quantity);

-- orders
CREATE INDEX idx_orders_user_id    ON orders (user_id);
CREATE INDEX idx_orders_status     ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- order_items
CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
CREATE INDEX idx_order_items_variant_id ON order_items (variant_id);

-- carts / cart_items
CREATE INDEX idx_carts_user_id          ON carts      (user_id);
CREATE INDEX idx_cart_items_cart_id     ON cart_items (cart_id);
CREATE INDEX idx_cart_items_variant_id  ON cart_items (variant_id);
CREATE INDEX idx_cart_items_product_id  ON cart_items (product_id);

-- wishlist
CREATE INDEX idx_wishlist_user_id    ON wishlist (user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist (product_id);

-- reviews
CREATE INDEX idx_reviews_product_id ON reviews (product_id);
CREATE INDEX idx_reviews_user_id    ON reviews (user_id);
CREATE INDEX idx_reviews_rating     ON reviews (rating);
CREATE INDEX idx_reviews_is_visible ON reviews (is_visible) WHERE is_visible = TRUE;

-- coupons
CREATE INDEX idx_coupons_code      ON coupons (code);
CREATE INDEX idx_coupons_is_active ON coupons (is_active) WHERE is_active = TRUE;

-- stock_alerts
CREATE INDEX idx_stock_alerts_variant_id  ON stock_alerts (variant_id);
CREATE INDEX idx_stock_alerts_product_id  ON stock_alerts (product_id);
CREATE INDEX idx_stock_alerts_is_resolved ON stock_alerts (is_resolved) WHERE is_resolved = FALSE;

-- notifications
CREATE INDEX idx_notifications_user_id  ON notifications (user_id);
CREATE INDEX idx_notifications_is_read  ON notifications (is_read)  WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- categories
CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_slug      ON categories (slug);

-- =============================================================================
-- UTILITY FUNCTION: updated_at auto-setter
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_set_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_set_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_set_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- FUNCTION: Get total stock for a product (across all variants)
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_get_product_total_stock(p_product_id BIGINT)
RETURNS INT LANGUAGE sql STABLE AS $$
    SELECT COALESCE(SUM(i.quantity), 0)::INT
    FROM   product_variants pv
    JOIN   inventory        i  ON i.variant_id = pv.id
    WHERE  pv.product_id = p_product_id;
$$;

-- =============================================================================
-- FUNCTION + TRIGGER: Auto-update product.status based on inventory
--
-- Rules applied per product after any inventory row changes:
--   total stock = 0                         -> out_of_stock
--   any variant quantity <= low_stock_threshold
--     AND total stock > 0                   -> low_stock
--   otherwise                               -> available
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_update_product_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_product_id      BIGINT;
    v_total_qty       INT;
    v_low_count       INT;
    v_new_status      product_status;
BEGIN
    -- Resolve product_id from the affected variant
    SELECT product_id
    INTO   v_product_id
    FROM   product_variants
    WHERE  id = COALESCE(NEW.variant_id, OLD.variant_id);

    IF v_product_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Total stock across all variants of this product
    v_total_qty := fn_get_product_total_stock(v_product_id);

    -- Count variants that are at or below their low-stock threshold
    SELECT COUNT(*)
    INTO   v_low_count
    FROM   product_variants pv
    JOIN   inventory        i ON i.variant_id = pv.id
    WHERE  pv.product_id = v_product_id
      AND  i.quantity    <= i.low_stock_threshold;

    -- Determine new status
    IF v_total_qty = 0 THEN
        v_new_status := 'out_of_stock';
    ELSIF v_low_count > 0 THEN
        v_new_status := 'low_stock';
    ELSE
        v_new_status := 'available';
    END IF;

    UPDATE products
    SET    status     = v_new_status,
           updated_at = NOW()
    WHERE  id = v_product_id
      AND  status <> v_new_status;   -- only write when it actually changes

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_product_status
    AFTER INSERT OR UPDATE OF quantity ON inventory
    FOR EACH ROW EXECUTE FUNCTION fn_update_product_status();

-- =============================================================================
-- FUNCTION + TRIGGER: Auto-create stock_alerts
--
-- Inserts a new (unresolved) alert only when no identical unresolved alert
-- already exists for that variant.  Resolves existing alerts when stock
-- recovers above threshold.
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_create_stock_alert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_product_id BIGINT;
    v_alert      alert_type;
BEGIN
    -- Only act on real quantity changes
    IF TG_OP = 'UPDATE' AND NEW.quantity = OLD.quantity THEN
        RETURN NEW;
    END IF;

    SELECT product_id
    INTO   v_product_id
    FROM   product_variants
    WHERE  id = NEW.variant_id;

    IF v_product_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.quantity = 0 THEN
        v_alert := 'out_of_stock';
    ELSIF NEW.quantity <= NEW.low_stock_threshold THEN
        v_alert := 'low_stock';
    ELSE
        -- Stock is healthy: resolve any open alerts for this variant
        UPDATE stock_alerts
        SET    is_resolved = TRUE
        WHERE  variant_id  = NEW.variant_id
          AND  is_resolved = FALSE;

        RETURN NEW;
    END IF;

    -- Insert alert only if no identical open alert exists
    INSERT INTO stock_alerts (variant_id, product_id, alert_type, is_resolved)
    SELECT NEW.variant_id, v_product_id, v_alert, FALSE
    WHERE NOT EXISTS (
        SELECT 1
        FROM   stock_alerts
        WHERE  variant_id  = NEW.variant_id
          AND  alert_type  = v_alert
          AND  is_resolved = FALSE
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_stock_alert
    AFTER INSERT OR UPDATE OF quantity ON inventory
    FOR EACH ROW EXECUTE FUNCTION fn_create_stock_alert();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
