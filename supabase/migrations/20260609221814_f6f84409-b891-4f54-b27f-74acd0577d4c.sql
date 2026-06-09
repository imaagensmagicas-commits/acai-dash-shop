GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;

-- Also ensure service_role has access to all tables for edge functions/admin tasks
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.store_settings TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;