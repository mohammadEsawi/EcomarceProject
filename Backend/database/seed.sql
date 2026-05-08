-- =============================================================================
-- Seed Data for Clothing Store E-Commerce
-- Run AFTER schema.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- CATEGORIES
-- =============================================================================

INSERT INTO categories (id, name, slug, description, image_url, parent_id, is_active) VALUES
(1, 'Men',         'men',         'Clothing and accessories for men',         'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800', NULL, TRUE),
(2, 'Women',       'women',       'Clothing and accessories for women',       'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', NULL, TRUE),
(3, 'Kids',        'kids',        'Clothing and accessories for children',    'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800', NULL, TRUE),
(4, 'Accessories', 'accessories', 'Bags, hats, belts and more',              'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?w=800', NULL, TRUE);

SELECT setval('categories_id_seq', 4);

-- =============================================================================
-- COLORS
-- =============================================================================

INSERT INTO colors (id, name, hex_code) VALUES
(1, 'Black', '#000000'),
(2, 'White', '#FFFFFF'),
(3, 'Navy',  '#001F5B'),
(4, 'Red',   '#C0392B'),
(5, 'Green', '#1E8449'),
(6, 'Beige', '#F5F0E8');

SELECT setval('colors_id_seq', 6);

-- =============================================================================
-- SIZES
-- =============================================================================

INSERT INTO sizes (id, name, display_order) VALUES
(1, 'XS', 1),
(2, 'S',  2),
(3, 'M',  3),
(4, 'L',  4),
(5, 'XL', 5);

SELECT setval('sizes_id_seq', 5);

-- =============================================================================
-- ADMIN
-- Password: Admin123!  (bcrypt, cost 10)
-- =============================================================================

INSERT INTO admins (id, name, email, password_hash) VALUES
(1,
 'Store Admin',
 'admin@store.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);
-- Note: replace the hash above with the real bcrypt hash of 'Admin123!' at deploy time.
-- Generated with: SELECT crypt('Admin123!', gen_salt('bf', 10));

SELECT setval('admins_id_seq', 1);

-- =============================================================================
-- PRODUCTS  (8 products: 4 Men, 4 Women)
-- =============================================================================

INSERT INTO products
    (id, name, slug, description, price, discount_price, category_id,
     is_featured, is_visible, status, main_image_url)
VALUES
-- Men's
(1,
 'Classic Oxford Shirt',
 'classic-oxford-shirt',
 'A timeless Oxford shirt crafted from 100% premium cotton. Features a button-down collar, chest pocket, and a relaxed fit perfect for both casual and smart-casual occasions.',
 89.99, 69.99, 1, TRUE,  TRUE, 'available',
 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800'),

(2,
 'Slim Fit Chino Trousers',
 'slim-fit-chino-trousers',
 'Modern slim-fit chinos cut from stretch-cotton twill. A versatile wardrobe staple that pairs effortlessly with shirts or tees.',
 109.99, NULL, 1, FALSE, TRUE, 'available',
 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'),

(3,
 'Essential Crew-Neck Sweatshirt',
 'essential-crew-neck-sweatshirt',
 'Heavyweight 320 gsm French terry sweatshirt. Dropped shoulders and a relaxed fit make this the ultimate laid-back layering piece.',
 74.99, 59.99, 1, FALSE, TRUE, 'available',
 'https://images.unsplash.com/photo-1611911813383-67769b37a149?w=800'),

(4,
 'Tailored Wool Blazer',
 'tailored-wool-blazer',
 'Single-breasted blazer in a wool-blend fabric. Fully lined with notch lapels and two button closure — ready for the boardroom or a dinner out.',
 299.99, 249.99, 1, TRUE,  TRUE, 'available',
 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800'),

-- Women's
(5,
 'Floral Wrap Dress',
 'floral-wrap-dress',
 'Effortlessly feminine wrap dress in a lightweight viscose fabric. Adjustable tie waist, flutter sleeves, and a midi length that flatters every silhouette.',
 119.99, 89.99, 2, TRUE,  TRUE, 'available',
 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'),

(6,
 'High-Waist Wide-Leg Trousers',
 'high-waist-wide-leg-trousers',
 'Statement wide-leg trousers with a high-rise waist and side zip fastening. Crafted in a fluid crepe fabric that drapes beautifully.',
 134.99, NULL, 2, FALSE, TRUE, 'available',
 'https://images.unsplash.com/photo-1548549557-dbe9946621da?w=800'),

(7,
 'Ribbed Turtleneck Knit',
 'ribbed-turtleneck-knit',
 'Cosy ribbed turtleneck in a soft cotton-blend yarn. A cold-weather essential that layers seamlessly under coats and blazers.',
 84.99, 64.99, 2, FALSE, TRUE, 'available',
 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800'),

(8,
 'Linen Button-Front Midi Skirt',
 'linen-button-front-midi-skirt',
 'Relaxed midi skirt cut from 100% stonewashed linen. A-line silhouette with a button-front placket and elasticated back waist.',
 99.99, NULL, 2, TRUE,  TRUE, 'available',
 'https://images.unsplash.com/photo-1583496661160-fb5218b9e73d?w=800');

SELECT setval('products_id_seq', 8);

-- =============================================================================
-- PRODUCT IMAGES
-- (2 images per product; first is the main)
-- =============================================================================

INSERT INTO product_images (id, product_id, image_url, display_order, is_main) VALUES
-- Product 1
( 1, 1, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800', 1, TRUE),
( 2, 1, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', 2, FALSE),
-- Product 2
( 3, 2, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800', 1, TRUE),
( 4, 2, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', 2, FALSE),
-- Product 3
( 5, 3, 'https://images.unsplash.com/photo-1611911813383-67769b37a149?w=800', 1, TRUE),
( 6, 3, 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800', 2, FALSE),
-- Product 4
( 7, 4, 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800', 1, TRUE),
( 8, 4, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', 2, FALSE),
-- Product 5
( 9, 5, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', 1, TRUE),
(10, 5, 'https://images.unsplash.com/photo-1508216310976-d5e9f4d3eb2c?w=800', 2, FALSE),
-- Product 6
(11, 6, 'https://images.unsplash.com/photo-1548549557-dbe9946621da?w=800', 1, TRUE),
(12, 6, 'https://images.unsplash.com/photo-1566206091558-7f218b696731?w=800', 2, FALSE),
-- Product 7
(13, 7, 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800', 1, TRUE),
(14, 7, 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800', 2, FALSE),
-- Product 8
(15, 8, 'https://images.unsplash.com/photo-1583496661160-fb5218b9e73d?w=800', 1, TRUE),
(16, 8, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800', 2, FALSE);

SELECT setval('product_images_id_seq', 16);

-- =============================================================================
-- PRODUCT VARIANTS
--
-- Variant ID encoding: (product_id - 1) * 15 + (color_slot - 1) * 5 + size_slot
-- We use a flat sequential approach for clarity.
--
-- Product 1 (Oxford Shirt)  — colors: Black(1), White(2), Navy(3)
-- Product 2 (Chino)         — colors: Navy(3), Beige(6)
-- Product 3 (Sweatshirt)    — colors: Black(1), Green(5)
-- Product 4 (Blazer)        — colors: Black(1), Navy(3)
-- Product 5 (Wrap Dress)    — colors: Red(4), Green(5)
-- Product 6 (Wide-Leg)      — colors: Black(1), Beige(6)
-- Product 7 (Turtleneck)    — colors: White(2), Beige(6)
-- Product 8 (Midi Skirt)    — colors: White(2), Green(5)
--
-- Sizes assigned per product:
-- Shirts / Tops / Dresses: XS S M L XL  (sizes 1-5)
-- Trousers / Skirts:       S M L         (sizes 2-4)
-- Blazer:                  S M L         (sizes 2-4)
-- =============================================================================

INSERT INTO product_variants (id, product_id, color_id, size_id, sku) VALUES
-- Product 1: Oxford Shirt — Black
( 1, 1, 1, 1, 'OXF-BLK-XS'),
( 2, 1, 1, 2, 'OXF-BLK-S'),
( 3, 1, 1, 3, 'OXF-BLK-M'),
( 4, 1, 1, 4, 'OXF-BLK-L'),
( 5, 1, 1, 5, 'OXF-BLK-XL'),
-- Product 1: Oxford Shirt — White
( 6, 1, 2, 1, 'OXF-WHT-XS'),
( 7, 1, 2, 2, 'OXF-WHT-S'),
( 8, 1, 2, 3, 'OXF-WHT-M'),
( 9, 1, 2, 4, 'OXF-WHT-L'),
(10, 1, 2, 5, 'OXF-WHT-XL'),
-- Product 1: Oxford Shirt — Navy
(11, 1, 3, 1, 'OXF-NVY-XS'),
(12, 1, 3, 2, 'OXF-NVY-S'),
(13, 1, 3, 3, 'OXF-NVY-M'),
(14, 1, 3, 4, 'OXF-NVY-L'),
(15, 1, 3, 5, 'OXF-NVY-XL'),

-- Product 2: Chino — Navy
(16, 2, 3, 2, 'CHN-NVY-S'),
(17, 2, 3, 3, 'CHN-NVY-M'),
(18, 2, 3, 4, 'CHN-NVY-L'),
-- Product 2: Chino — Beige
(19, 2, 6, 2, 'CHN-BGE-S'),
(20, 2, 6, 3, 'CHN-BGE-M'),
(21, 2, 6, 4, 'CHN-BGE-L'),

-- Product 3: Sweatshirt — Black
(22, 3, 1, 1, 'SWT-BLK-XS'),
(23, 3, 1, 2, 'SWT-BLK-S'),
(24, 3, 1, 3, 'SWT-BLK-M'),
(25, 3, 1, 4, 'SWT-BLK-L'),
(26, 3, 1, 5, 'SWT-BLK-XL'),
-- Product 3: Sweatshirt — Green
(27, 3, 5, 1, 'SWT-GRN-XS'),
(28, 3, 5, 2, 'SWT-GRN-S'),
(29, 3, 5, 3, 'SWT-GRN-M'),
(30, 3, 5, 4, 'SWT-GRN-L'),
(31, 3, 5, 5, 'SWT-GRN-XL'),

-- Product 4: Blazer — Black
(32, 4, 1, 2, 'BLZ-BLK-S'),
(33, 4, 1, 3, 'BLZ-BLK-M'),
(34, 4, 1, 4, 'BLZ-BLK-L'),
-- Product 4: Blazer — Navy
(35, 4, 3, 2, 'BLZ-NVY-S'),
(36, 4, 3, 3, 'BLZ-NVY-M'),
(37, 4, 3, 4, 'BLZ-NVY-L'),

-- Product 5: Wrap Dress — Red
(38, 5, 4, 1, 'WRD-RED-XS'),
(39, 5, 4, 2, 'WRD-RED-S'),
(40, 5, 4, 3, 'WRD-RED-M'),
(41, 5, 4, 4, 'WRD-RED-L'),
(42, 5, 4, 5, 'WRD-RED-XL'),
-- Product 5: Wrap Dress — Green
(43, 5, 5, 1, 'WRD-GRN-XS'),
(44, 5, 5, 2, 'WRD-GRN-S'),
(45, 5, 5, 3, 'WRD-GRN-M'),
(46, 5, 5, 4, 'WRD-GRN-L'),
(47, 5, 5, 5, 'WRD-GRN-XL'),

-- Product 6: Wide-Leg — Black
(48, 6, 1, 2, 'WLT-BLK-S'),
(49, 6, 1, 3, 'WLT-BLK-M'),
(50, 6, 1, 4, 'WLT-BLK-L'),
-- Product 6: Wide-Leg — Beige
(51, 6, 6, 2, 'WLT-BGE-S'),
(52, 6, 6, 3, 'WLT-BGE-M'),
(53, 6, 6, 4, 'WLT-BGE-L'),

-- Product 7: Turtleneck — White
(54, 7, 2, 1, 'TRN-WHT-XS'),
(55, 7, 2, 2, 'TRN-WHT-S'),
(56, 7, 2, 3, 'TRN-WHT-M'),
(57, 7, 2, 4, 'TRN-WHT-L'),
(58, 7, 2, 5, 'TRN-WHT-XL'),
-- Product 7: Turtleneck — Beige
(59, 7, 6, 1, 'TRN-BGE-XS'),
(60, 7, 6, 2, 'TRN-BGE-S'),
(61, 7, 6, 3, 'TRN-BGE-M'),
(62, 7, 6, 4, 'TRN-BGE-L'),
(63, 7, 6, 5, 'TRN-BGE-XL'),

-- Product 8: Midi Skirt — White
(64, 8, 2, 2, 'MSK-WHT-S'),
(65, 8, 2, 3, 'MSK-WHT-M'),
(66, 8, 2, 4, 'MSK-WHT-L'),
-- Product 8: Midi Skirt — Green
(67, 8, 5, 2, 'MSK-GRN-S'),
(68, 8, 5, 3, 'MSK-GRN-M'),
(69, 8, 5, 4, 'MSK-GRN-L');

SELECT setval('product_variants_id_seq', 69);

-- =============================================================================
-- INVENTORY
-- Deliberately varied quantities:
--   - Some zero   -> triggers 'out_of_stock' via trigger
--   - Some 1-5    -> triggers 'low_stock' via trigger
--   - Most 10-50  -> 'available'
-- low_stock_threshold = 5 (default) for all records
-- =============================================================================

INSERT INTO inventory (variant_id, quantity, low_stock_threshold) VALUES
-- Product 1 — Oxford Shirt
( 1,  0,  5),   -- OXF-BLK-XS  -> out_of_stock trigger
( 2, 12,  5),
( 3, 30,  5),
( 4, 25,  5),
( 5,  8,  5),
( 6, 15,  5),
( 7, 22,  5),
( 8, 40,  5),
( 9, 18,  5),
(10,  3,  5),   -- OXF-WHT-XL  -> low_stock trigger
(11,  0,  5),   -- OXF-NVY-XS  -> out_of_stock
(12, 10,  5),
(13, 28,  5),
(14, 16,  5),
(15,  5,  5),   -- OXF-NVY-XL  -> low_stock (quantity == threshold)

-- Product 2 — Chino
(16, 20,  5),
(17, 35,  5),
(18, 14,  5),
(19, 22,  5),
(20, 40,  5),
(21, 11,  5),

-- Product 3 — Sweatshirt
(22, 18,  5),
(23, 25,  5),
(24, 33,  5),
(25, 20,  5),
(26,  2,  5),   -- SWT-BLK-XL  -> low_stock
(27,  0,  5),   -- SWT-GRN-XS  -> out_of_stock
(28, 14,  5),
(29, 22,  5),
(30, 16,  5),
(31,  9,  5),

-- Product 4 — Blazer
(32, 10,  3),
(33, 14,  3),
(34,  8,  3),
(35,  1,  3),   -- BLZ-NVY-S   -> low_stock
(36, 12,  3),
(37,  0,  3),   -- BLZ-NVY-L   -> out_of_stock

-- Product 5 — Wrap Dress
(38, 20,  5),
(39, 35,  5),
(40, 48,  5),
(41, 30,  5),
(42, 12,  5),
(43, 18,  5),
(44, 27,  5),
(45, 45,  5),
(46, 32,  5),
(47,  4,  5),   -- WRD-GRN-XL  -> low_stock

-- Product 6 — Wide-Leg
(48, 16,  5),
(49, 24,  5),
(50, 19,  5),
(51, 22,  5),
(52, 30,  5),
(53,  3,  5),   -- WLT-BGE-L   -> low_stock

-- Product 7 — Turtleneck
(54, 12,  5),
(55, 20,  5),
(56, 28,  5),
(57, 15,  5),
(58,  0,  5),   -- TRN-WHT-XL  -> out_of_stock
(59,  8,  5),
(60, 16,  5),
(61, 24,  5),
(62, 11,  5),
(63,  4,  5),   -- TRN-BGE-XL  -> low_stock

-- Product 8 — Midi Skirt
(64, 18,  5),
(65, 30,  5),
(66, 22,  5),
(67, 14,  5),
(68, 26,  5),
(69,  0,  5);   -- MSK-GRN-L   -> out_of_stock

-- =============================================================================
-- COUPONS
-- =============================================================================

INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, is_active, expires_at) VALUES
(1,
 'SAVE10',
 'percentage',
 10.00,
 50.00,
 500,
 0,
 TRUE,
 NOW() + INTERVAL '6 months'),

(2,
 'FLAT20',
 'fixed',
 20.00,
 80.00,
 200,
 0,
 TRUE,
 NOW() + INTERVAL '3 months');

SELECT setval('coupons_id_seq', 2);

-- =============================================================================
-- Verify row counts
-- =============================================================================

DO $$
DECLARE
    v_categories  INT; v_colors     INT; v_sizes     INT;
    v_products    INT; v_variants   INT; v_inventory INT;
    v_images      INT; v_coupons    INT; v_admins    INT;
BEGIN
    SELECT COUNT(*) INTO v_categories  FROM categories;
    SELECT COUNT(*) INTO v_colors      FROM colors;
    SELECT COUNT(*) INTO v_sizes       FROM sizes;
    SELECT COUNT(*) INTO v_products    FROM products;
    SELECT COUNT(*) INTO v_variants    FROM product_variants;
    SELECT COUNT(*) INTO v_inventory   FROM inventory;
    SELECT COUNT(*) INTO v_images      FROM product_images;
    SELECT COUNT(*) INTO v_coupons     FROM coupons;
    SELECT COUNT(*) INTO v_admins      FROM admins;

    RAISE NOTICE '=== Seed Verification ===';
    RAISE NOTICE 'categories:       %', v_categories;
    RAISE NOTICE 'colors:           %', v_colors;
    RAISE NOTICE 'sizes:            %', v_sizes;
    RAISE NOTICE 'products:         %', v_products;
    RAISE NOTICE 'product_variants: %', v_variants;
    RAISE NOTICE 'inventory:        %', v_inventory;
    RAISE NOTICE 'product_images:   %', v_images;
    RAISE NOTICE 'coupons:          %', v_coupons;
    RAISE NOTICE 'admins:           %', v_admins;
    RAISE NOTICE '=========================';
END $$;

-- Check product statuses after triggers fired
SELECT id, name, status FROM products ORDER BY id;

COMMIT;

-- =============================================================================
-- END OF SEED
-- =============================================================================
