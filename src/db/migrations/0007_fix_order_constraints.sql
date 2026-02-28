-- Migration 0007: Fix database constraints for order forms
-- Make all optional fields properly nullable to match the new form logic

-- Make customer_address nullable (it's optional for pickup orders)
ALTER TABLE `orders` ALTER COLUMN `customer_address` DROP NOT NULL;

-- Make wrapper color fields explicitly nullable
ALTER TABLE `orders` ALTER COLUMN `wrapper_color_id` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `wrapper_color_name` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `wrapper_color_hex` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `wrapper_color_image_url` DROP NOT NULL;

-- Make pot fields nullable
ALTER TABLE `orders` ALTER COLUMN `pot_id` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `pot_name` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `pot_image_url` DROP NOT NULL;

-- Make order type items nullable (they have defaults)
ALTER TABLE `orders` ALTER COLUMN `bouquet_items` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `mini_pot_items` DROP NOT NULL;
ALTER TABLE `orders` ALTER COLUMN `shop_items` DROP NOT NULL;

-- Make delivery fee nullable with default 0
ALTER TABLE `orders` ALTER COLUMN `delivery_fee` DROP NOT NULL;

-- Make notes nullable
ALTER TABLE `orders` ALTER COLUMN `notes` DROP NOT NULL;
