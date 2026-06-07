ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT;
UPDATE public.store_settings SET instagram_url = 'https://www.instagram.com/kl_acai2026' WHERE slug = 'loja';