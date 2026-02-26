import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("flower"), // 'flower' | 'finished_good'
  price: real("price").notNull(),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  imageEmoji: text("image_emoji").notNull().default("🌸"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const wrapperColors = sqliteTable("wrapper_colors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  colorHex: text("color_hex").notNull(),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  orderType: text("order_type").notNull().default("bouquet"), // 'bouquet' | 'shop'
  bouquetItems: text("bouquet_items").notNull().default("[]"), // JSON array of {productId, name, quantity}
  wrapperColorId: integer("wrapper_color_id"),
  wrapperColorName: text("wrapper_color_name"),
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
