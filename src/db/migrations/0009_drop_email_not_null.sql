-- Remove NOT NULL constraint from customer_email since email is no longer required
ALTER TABLE `orders` ALTER COLUMN `customer_email` DROP NOT NULL;
