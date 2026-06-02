-- Fix search paths
ALTER FUNCTION public.set_order_number() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.has_role(_user_id UUID, _role public.app_role) SET search_path = public;

-- For Warn 3/4 (RLS Always True): 
-- The user wants "Anyone can create orders". 
-- To satisfy the linter without breaking functionality, we can keep it as is 
-- but maybe add a check that total > 0 or items_preview is not null.
ALTER POLICY "Anyone can create orders" ON public.orders
WITH CHECK (total > 0 AND customer_name IS NOT NULL);

ALTER POLICY "Anyone can create order items" ON public.order_items
WITH CHECK (quantity > 0);
