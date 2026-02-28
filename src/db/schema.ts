import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("flower"), // 'flower' | 'finished_good' | 'pot' | 'fuzzy_wire_flower'
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
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
  imageUrl: text("image_url").default(""),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"), // For logged-in users
  facebookId: text("facebook_id"), // Facebook account identifier
  customerName: text("customer_name").notNull(),
  facebookName: text("facebook_name"), // Facebook name for contact via Messenger
  customerEmail: text("customer_email"), // Optional - can use facebook_name instead
  customerAddress: text("customer_address").notNull().default(""),
  deliveryType: text("delivery_type").notNull().default("home"), // 'home' | 'pickup'
  deliveryLocation: text("delivery_location"), // Location for delivery fee calculation
  deliveryFee: real("delivery_fee").notNull().default(0), // ₱10 for Anini-y home delivery
  orderType: text("order_type").notNull().default("bouquet"), // 'bouquet' | 'mini_pot' | 'shop'
  bouquetItems: text("bouquet_items").notNull().default("[]"), // JSON array of {productId, name, quantity, imageUrl}
  miniPotItems: text("mini_pot_items").notNull().default("[]"), // JSON array of {productId, name, quantity, imageUrl} for fuzzy wire flowers
  shopItems: text("shop_items").notNull().default("[]"), // JSON array of {productId, name, quantity, price, imageUrl} for shop/finished goods
  potId: integer("pot_id"), // Selected pot product ID
  potName: text("pot_name"),
  potImageUrl: text("pot_image_url"),
  wrapperColorId: integer("wrapper_color_id"),
  wrapperColorName: text("wrapper_color_name"),
  wrapperColorHex: text("wrapper_color_hex"),
  wrapperColorImageUrl: text("wrapper_color_image_url"),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: text("notes").default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const adminSessions = sqliteTable("admin_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
