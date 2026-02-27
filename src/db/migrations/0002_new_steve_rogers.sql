ALTER TABLE `orders` ADD `mini_pot_items` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `pot_id` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `pot_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pot_image_url` text;--> statement-breakpoint
ALTER TABLE `products` ADD `sale_price` real;--> statement-breakpoint
ALTER TABLE `products` ADD `stock_quantity` integer DEFAULT 0 NOT NULL;