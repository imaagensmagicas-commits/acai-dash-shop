-- Revoke public execution of security definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;

-- Note: set_order_number and tg_set_updated_at are trigger functions, 
-- they usually don't need direct execute grants but it's safe to restrict them.
REVOKE EXECUTE ON FUNCTION public.set_order_number() FROM public;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM public;
