-- Migration: Fix NULL stockQuantity in products table
-- Set stockQuantity to 10 for products that have NULL stockQuantity
UPDATE products SET stock_quantity = 10 WHERE stock_quantity IS NULL;
