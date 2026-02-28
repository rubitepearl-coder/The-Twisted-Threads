ALTER TABLE `orders` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `facebook_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_type` text DEFAULT 'home' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_location` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_fee` real DEFAULT 0 NOT NULL;
