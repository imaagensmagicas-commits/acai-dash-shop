
-- 1) Tighten order_items INSERT policy to validate order_id references a recently-created order
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Insert items only for recently created orders"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  quantity > 0
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.created_at > now() - interval '5 minutes'
  )
);

-- 2) Restrict realtime.messages subscriptions to admins only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can receive realtime messages" ON realtime.messages;

CREATE POLICY "Admins can receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
