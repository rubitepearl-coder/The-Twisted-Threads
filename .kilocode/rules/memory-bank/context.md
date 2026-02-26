# Active Context: The Petal Loop – Custom Crochet Florist & Boutique

## Current State

**Project Status**: ✅ Full e-commerce site built and ready for deployment

The template has been fully expanded into "The Petal Loop" — a custom crochet florist and boutique e-commerce site with a bouquet builder, shop, and admin dashboard.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Database setup (Drizzle ORM + SQLite via @kilocode/app-builder-db)
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

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/bouquet-builder/` | Custom bouquet builder | ✅ Ready |
| `src/app/shop/` | Product catalog | ✅ Ready |
| `src/app/order-confirmation/` | Post-order page | ✅ Ready |
| `src/app/admin/` | Admin dashboard (login, inventory, orders) | ✅ Ready |
| `src/app/api/` | REST API routes | ✅ Ready |
| `src/db/` | Drizzle ORM schema, migrations, seed | ✅ Ready |
| `src/components/layout/` | Header, Footer | ✅ Ready |
| `src/components/admin/` | AdminLogoutButton | ✅ Ready |
| `src/lib/auth.ts` | Admin session auth helper | ✅ Ready |

## Admin Access

- URL: `/admin/login`
- Default password: `petalloop2024` (set via `ADMIN_PASSWORD` env var)
- Sessions expire after 24 hours

## Database Schema

| Table | Purpose |
|-------|---------|
| `products` | Flowers and finished goods with price, stock, emoji |
| `wrapper_colors` | Bouquet wrapper color options |
| `orders` | Customer orders with bouquet recipe JSON |
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
