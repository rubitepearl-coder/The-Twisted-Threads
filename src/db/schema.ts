import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("flower"), // 'flower' | 'finished_good' | 'pot' | 'fuzzy_wire_flower'
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  stockQuantity: integer("stock_quantity"), // NULL = unlimited/not tracked, number = limited stock
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  imageEmoji: text("image_emoji").notNull().default("🌸"),
  imageUrl: text("image_url").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const wrapperColors = sqliteTable("wrapper_colors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  colorHex: text("color_hex").notNull(),
  price: real("price").default(0), // Price for this wrapper color
  imageUrl: text("image_url").default(""),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
});

export const addons = sqliteTable("addons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("addon"), // 'letter' | 'wrapper' | 'card' | 'other'
  price: real("price").notNull(),
  imageUrl: text("image_url").default(""),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  availableFor: text("available_for").notNull().default("both"), // 'bouquet' | 'mini_pot' | 'both'
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"), // For logged-in users - now optional
  facebookId: text("facebook_id"), // Facebook account identifier - now optional
  customerName: text("customer_name").notNull(), // Full name - REQUIRED
  facebookName: text("facebook_name"), // Facebook name for contact via Messenger - now optional
  customerEmail: text("customer_email"), // Optional - can use facebook_name instead
  customerAddress: text("customer_address"), // Optional - not required for pickup
  deliveryType: text("delivery_type").notNull().default("pickup"), // 'home' | 'pickup' - default to pickup
  deliveryLocation: text("delivery_location"), // Location for delivery fee calculation - optional
  deliveryFee: real("delivery_fee").default(0), // ₱10 for home delivery - default 0
  orderType: text("order_type").notNull().default("bouquet"), // 'bouquet' | 'mini_pot' | 'shop'
  bouquetItems: text("bouquet_items"), // JSON array of {productId, name, quantity, imageUrl}
  miniPotItems: text("mini_pot_items"), // JSON array of {productId, name, quantity, imageUrl} for fuzzy wire flowers
  shopItems: text("shop_items"), // JSON array of {productId, name, quantity, price, imageUrl} for shop/finished goods
  potId: integer("pot_id"), // Selected pot product ID
  potName: text("pot_name"),
  potImageUrl: text("pot_image_url"),
  wrapperColorId: integer("wrapper_color_id"),
  wrapperColorName: text("wrapper_color_name"),
  wrapperColorHex: text("wrapper_color_hex"),
  wrapperColorImageUrl: text("wrapper_color_image_url"),
  addonItems: text("addon_items"),
  addonMessage: text("addon_message"),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: text("notes"), // Optional notes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const adminSessions = sqliteTable("admin_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
