CREATE TABLE `admin_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`created_at` integer,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_sessions_token_unique` ON `admin_sessions` (`token`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`order_type` text DEFAULT 'bouquet' NOT NULL,
	`bouquet_items` text DEFAULT '[]' NOT NULL,
	`wrapper_color_id` integer,
	`wrapper_color_name` text,
	`total_price` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text DEFAULT '',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'flower' NOT NULL,
	`price` real NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL,
	`image_emoji` text DEFAULT '🌸' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `wrapper_colors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color_hex` text NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL
);
