-- Add price column to wrapper_colors table if it doesn't exist
ALTER TABLE `wrapper_colors` ADD COLUMN `price` real DEFAULT 0;
