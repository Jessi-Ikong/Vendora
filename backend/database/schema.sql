-- Drop tables if they exist (useful during development)
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users
CREATE TABLE users (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    email               VARCHAR(150)    UNIQUE NOT NULL,
    password            TEXT            NOT NULL,
    role                VARCHAR(20)     NOT NULL DEFAULT 'buyer',
    avatar              TEXT,
    is_active           BOOLEAN         DEFAULT true,
    is_verified         BOOLEAN         DEFAULT false,
    reset_token         TEXT,
    reset_token_expires TIMESTAMP,
    created_at          TIMESTAMP       DEFAULT NOW(),
    updated_at          TIMESTAMP       DEFAULT NOW()
);

-- 2. Vendor Profiles
CREATE TABLE vendor_profiles (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name   VARCHAR(150)    NOT NULL,
    store_slug   VARCHAR(150)    UNIQUE NOT NULL,
    description  TEXT,
    logo         TEXT,
    banner       TEXT,
    is_approved  BOOLEAN         DEFAULT false,
    total_sales  INTEGER         DEFAULT 0,
    created_at   TIMESTAMP       DEFAULT NOW(),
    updated_at   TIMESTAMP       DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    UNIQUE NOT NULL,
    slug        VARCHAR(100)    UNIQUE NOT NULL,
    description TEXT,
    image       TEXT,
    parent_id   INTEGER         REFERENCES categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMP       DEFAULT NOW()
);

-- 4. Products
CREATE TABLE products (
    id             SERIAL PRIMARY KEY,
    vendor_id      INTEGER         NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    category_id    INTEGER         REFERENCES categories(id) ON DELETE SET NULL,
    name           VARCHAR(200)    NOT NULL,
    slug           VARCHAR(200)    UNIQUE NOT NULL,
    description    TEXT,
    price          NUMERIC(10, 2)  NOT NULL,
    discount_price NUMERIC(10, 2),
    stock          INTEGER         NOT NULL DEFAULT 0,
    is_published   BOOLEAN         DEFAULT false,
    total_sold     INTEGER         DEFAULT 0,
    average_rating NUMERIC(3, 2)   DEFAULT 0,
    created_at     TIMESTAMP       DEFAULT NOW(),
    updated_at     TIMESTAMP       DEFAULT NOW()
);

-- 5. Product Images
CREATE TABLE product_images (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url  TEXT        NOT NULL,
    is_primary BOOLEAN     DEFAULT false,
    created_at TIMESTAMP   DEFAULT NOW()
);

-- 6. Addresses
CREATE TABLE addresses (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name     VARCHAR(100)    NOT NULL,
    phone         VARCHAR(20)     NOT NULL,
    address_line1 VARCHAR(200)    NOT NULL,
    address_line2 VARCHAR(200),
    city          VARCHAR(100)    NOT NULL,
    state         VARCHAR(100)    NOT NULL,
    country       VARCHAR(100)    NOT NULL DEFAULT 'Nigeria',
    is_default    BOOLEAN         DEFAULT false,
    created_at    TIMESTAMP       DEFAULT NOW()
);

-- 7. Carts
CREATE TABLE carts (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP   DEFAULT NOW(),
    updated_at TIMESTAMP   DEFAULT NOW()
);

-- 8. Cart Items
CREATE TABLE cart_items (
    id         SERIAL PRIMARY KEY,
    cart_id    INTEGER     NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER     NOT NULL DEFAULT 1,
    created_at TIMESTAMP   DEFAULT NOW(),
    updated_at TIMESTAMP   DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 9. Orders
CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    buyer_id         INTEGER         NOT NULL REFERENCES users(id),
    address_id       INTEGER         REFERENCES addresses(id) ON DELETE SET NULL,
    total_amount     NUMERIC(10, 2)  NOT NULL,
    status           VARCHAR(30)     NOT NULL DEFAULT 'pending',
    payment_status   VARCHAR(30)     NOT NULL DEFAULT 'unpaid',
    payment_method   VARCHAR(50)     DEFAULT 'paystack',
    paystack_ref     TEXT,
    delivery_code    VARCHAR(10),
    notes            TEXT,
    created_at       TIMESTAMP       DEFAULT NOW(),
    updated_at       TIMESTAMP       DEFAULT NOW()
);

-- 10. Order Items
CREATE TABLE order_items (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    INTEGER         REFERENCES products(id) ON DELETE SET NULL,
    vendor_id     INTEGER         REFERENCES vendor_profiles(id) ON DELETE SET NULL,
    product_name  VARCHAR(200)    NOT NULL,
    product_image TEXT,
    price         NUMERIC(10, 2)  NOT NULL,
    quantity      INTEGER         NOT NULL,
    subtotal      NUMERIC(10, 2)  NOT NULL,
    status        VARCHAR(30)     DEFAULT 'pending',
    created_at    TIMESTAMP       DEFAULT NOW()
);

-- 11. Reviews
CREATE TABLE reviews (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMP   DEFAULT NOW(),
    updated_at TIMESTAMP   DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- 12. Wishlists
CREATE TABLE wishlists (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP   DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);