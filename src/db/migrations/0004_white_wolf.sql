-- Add shop_items column to orders table
ALTER TABLE orders ADD COLUMN shop_items text NOT NULL DEFAULT '[]';
