-- Add optional image URLs for fruit and vegetable inventory items.
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS image_url text;
