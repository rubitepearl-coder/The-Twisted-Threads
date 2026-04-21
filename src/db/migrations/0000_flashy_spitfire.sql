CREATE TABLE `addons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'addon' NOT NULL,
	`price` real NOT NULL,
	`image_url` text DEFAULT '',
	`in_stock` integer DEFAULT true NOT NULL,
	`stock_quantity` integer,
	`available_for` text DEFAULT 'both' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`created_at` integer,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_sessions_token_unique` ON `admin_sessions` (`token`);--> statement-breakpoint
CREATE TABLE `delivery_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_name` text NOT NULL,
	`delivery_fee` real DEFAULT 0 NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`facebook_id` text,
	`customer_name` text NOT NULL,
	`facebook_name` text,
	`customer_email` text,
	`customer_address` text,
	`delivery_type` text DEFAULT 'pickup' NOT NULL,
	`delivery_location` text,
	`delivery_fee` real DEFAULT 0,
	`order_type` text DEFAULT 'bouquet' NOT NULL,
	`bouquet_items` text,
	`mini_pot_items` text,
	`shop_items` text,
	`pot_id` integer,
	`pot_name` text,
	`pot_image_url` text,
	`pot_price` real,
	`wrapper_color_id` integer,
	`wrapper_color_name` text,
	`wrapper_color_hex` text,
	`wrapper_color_image_url` text,
	`wrapper_color_price` real,
	`addon_items` text,
	`addon_message` text,
	`total_price` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'flower' NOT NULL,
	`price` real NOT NULL,
	`sale_price` real,
	`stock_quantity` integer,
	`in_stock` integer DEFAULT true NOT NULL,
	`image_emoji` text DEFAULT '🌸' NOT NULL,
	`image_url` text DEFAULT '',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `wrapper_colors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color_hex` text NOT NULL,
	`price` real DEFAULT 0,
	`image_url` text DEFAULT '',
	`in_stock` integer DEFAULT true NOT NULL
);
