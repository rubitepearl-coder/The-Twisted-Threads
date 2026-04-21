-- Add subcategory column to products table
ALTER TABLE products ADD COLUMN subcategory TEXT DEFAULT 'Uncategorized';
