-- Make customer_email nullable so orders can be placed with just Facebook name
ALTER TABLE `orders` ALTER COLUMN `customer_email` DROP NOT NULL;