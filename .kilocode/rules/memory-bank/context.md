# Active Context: The Petal Loop – Custom Crochet Florist & Boutique

## Current State

**Project Status**: ✅ Full e-commerce site built with custom order forms

The template has been fully expanded into "The Twisted Threads" — a custom crochet florist and boutique e-commerce site with a bouquet builder, mini-pot builder, shop, and admin dashboard.

## Recently Completed

- [x] **FIX: Column Name Mapping (camelCase to snake_case)** - Added `COLUMN_NAME_MAP` to convert camelCase JavaScript keys to snake_case SQL column names in `buildInsertSQL()` function. Fixed deployment error "table orders has no column named customerName" by ensuring raw SQL inserts use correct snake_case column names matching the Turso database schema.

- [x] **FIX: Admin Dashboard Data Filtering** - Removed old email-based filtering from `/api/orders/route.ts`. Admin now correctly fetches all orders without any user_id/facebook_id/owner_id filtering. Customer "My Orders" now matches by BOTH customerName AND facebookName (OR logic) for better order lookup.

- [x] **FIX: Order INSERT using raw SQL** - Replaced Drizzle ORM insert with raw SQL using `buildInsertSQL()` helper to explicitly control which columns are inserted. Now only inserts: customer_name, facebook_name, customer_email, customer_address, delivery_type, delivery_location, delivery_fee, order_type, bouquet_items, mini_pot_items, shop_items, pot_id, pot_name, pot_image_url, total_price, status, created_at. No longer inserts: id (auto-generated), user_id, facebook_id, wrapper_color_*

- [x] Database migration 0007: Fix order constraints - made all optional fields nullable (customer_address, wrapper fields, pot fields, delivery_fee, notes)
- [x] Updated API insert logic to only include required fields
- [x] Fixed delivery logic: pickup = no location/fee (0), delivery = location required
- [x] Removed userId/facebookId from insert query - orders can be placed without login
- [x] Order form updates: Added Full Name and Facebook Name fields, made email optional
- [x] Database migration 0006: Added facebook_name column to orders table
- [x] All order forms (bouquet-builder, mini-pot-builder, shop) now have:
  - Full Name (required) - for shipping records
  - Facebook Name (required) - for contact via Messenger
  - Email (optional) - visible but not required
- [x] API validation updated to require both Full Name and Facebook Name
- [x] Removed all blocking logic for email and Facebook ID requirements

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Database setup (Drizzle ORM + SQLite via @libsql/client)
- [x] Database schema: products, wrapperColors, orders, adminSessions
- [x] Database migrations generated
- [x] Global layout with earthy/cozy Header and Footer
- [x] Home page with hero, how-it-works, featured flowers, and CTA sections
- [x] Bouquet Builder page (/bouquet-builder) — interactive flower quantity selector + wrapper color picker
- [x] Shop page (/shop) — displays finished goods and individual stems
- [x] Order Confirmation page (/order-confirmation)
- [x] Admin Login page (/admin/login) — password-protected
- [x] Admin Dashboard (/admin/dashboard) — stats overview + recent orders
- [x] Admin Inventory page (/admin/inventory) — full CRUD for products + wrapper colors
- [x] Admin Orders page (/admin/orders) — filterable order list with status updates
- [x] API routes: /api/orders, /api/products, /api/wrapper-colors, /api/admin/login, /api/admin/logout, /api/seed
- [x] Seed data: 8 flowers, 4 finished goods, 7 wrapper colors
- [x] Admin auth via cookie-based sessions (token stored in adminSessions table)
- [x] Visual overhaul: 1:1 square aspect ratio images using object-fit: cover on all products, flowers, and wrapper colors
- [x] Admin can upload/edit photo URLs for products and wrapper colors in inventory
- [x] Bouquet Builder collects customer delivery address at checkout
- [x] Personalized Thank You page with order summary, flower thumbnails, and shipping details
- [x] Admin Orders page shows customer name, address, flower thumbnails, and wrapper color for fulfillment
- [x] Google Sheets integration: External backend via Google Apps Script for order & inventory tracking
- [x] Switched to @libsql/client + drizzle-orm with Turso cloud database (requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars)
- [x] Shop ordering: Full cart & checkout flow for finished goods (amigurumi, crochet items) with "Add to Cart" buttons, cart modal, and checkout form
- [x] Added "Add More Items" button to cart modal for continue shopping
- [x] Added built-in image upload feature to admin inventory (POST /api/upload)
- [x] Cloudinary integration for permanent image storage (resolves Vercel ephemeral filesystem issue)
- [x] Added "My Orders" page for customers to track orders by email
- [x] Added Customer Login page with order lookup by email
- [x] Fixed node-domexception deprecation warning in package.json
- [x] Removed email field from all order forms - customers now order via Facebook name only (migration 0005)

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/bouquet-builder/` | Custom bouquet builder with square images + address collection | ✅ Ready |
| `src/app/shop/` | Product catalog with square images | ✅ Ready |
| `src/app/order-confirmation/` | Personalized thank you page with order details | ✅ Ready |
| `src/app/admin/` | Admin dashboard (login, inventory, orders) | ✅ Ready |
| `src/app/api/` | REST API routes | ✅ Ready |
| `src/db/` | Drizzle ORM schema, migrations, seed | ✅ Ready |
| `src/components/layout/` | Header, Footer | ✅ Ready |
| `src/components/admin/` | AdminLogoutButton | ✅ Ready |
| `src/lib/auth.ts` | Admin session auth helper | ✅ Ready |
| `src/lib/googleSheets.ts` | Google Apps Script integration for external storage | ✅ Ready |
| `google-apps-script/` | Google Apps Script backend code + setup instructions | ✅ Ready |

## Admin Access

- URL: `/admin/login`
- Default password: `petalloop2024` (set via `ADMIN_PASSWORD` env var)
- Sessions expire after 24 hours

## Database Schema

| Table | Purpose |
|-------|---------|
| `products` | Flowers and finished goods with price, stock, emoji, imageUrl |
| `wrapper_colors` | Bouquet wrapper color options with imageUrl |
| `orders` | Customer orders with bouquet recipe JSON, customerName, customerAddress, wrapper color info |
| `admin_sessions` | Auth tokens for admin login |

## Seed Data

After deployment, call `POST /api/seed` to populate the database with:
- 8 flower types (Rose, Tulip, Sunflower, Daisy, Lavender, Cherry Blossom, Lily, Hibiscus)
- 4 finished goods (Classic Rose Bouquet, Spring Mix, Sunflower Centerpiece, Mini Bud Vase Set)
- 7 wrapper colors (Kraft Brown, Sage Green, Dusty Rose, Cream White, Terracotta, Lavender Mist, Midnight Black)

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-02-26 | Full e-commerce site built: The Petal Loop crochet florist boutique |
| 2026-02-26 | Bug fix: Added `src/instrumentation.ts` to auto-run DB migrations on server startup, fixing admin login 500 error caused by missing tables |
| 2026-02-26 | Visual overhaul: Square images (1:1 aspect ratio), address collection in bouquet builder, personalized thank you page, enhanced admin order fulfillment view |
| 2026-02-27 | Switched to @libsql/client for cloud-compatible SQLite database (works with Turso or local file)
| 2026-02-28 | Cloudinary integration for image uploads; Fixed node-domexception deprecation warning
| 2026-02-28 | Removed email field from order forms - customers now order via Facebook name only (migration 0005)
| 2026-02-28 | Fixed database constraints (migration 0007): Made optional fields nullable, fixed delivery logic for pickup vs delivery
| 2026-03-01 | Fixed admin dashboard data filtering: Removed email filter, customer orders now match by customerName OR facebookName
| 2026-03-01 | Fixed deployment error: Added column name mapping (camelCase to snake_case) for raw SQL inserts in orders API
