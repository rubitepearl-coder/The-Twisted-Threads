ALTER TABLE `orders` ADD `customer_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `wrapper_color_hex` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `wrapper_color_image_url` text;--> statement-breakpoint
ALTER TABLE `products` ADD `image_url` text DEFAULT '';--> statement-breakpoint
ALTER TABLE `wrapper_colors` ADD `image_url` text DEFAULT '';