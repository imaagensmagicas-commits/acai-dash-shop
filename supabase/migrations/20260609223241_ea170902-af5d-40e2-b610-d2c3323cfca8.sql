-- 1. Fix profiles: restrict SELECT to owner
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix products: simplify anon policy to not call has_role, add admin policy for SELECT
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins view all products"
ON public.products FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Revoke has_role EXECUTE from anon (no longer needed)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- 4. Add INSERT policy on realtime.messages for admins only (broadcast/presence)
DROP POLICY IF EXISTS "Admins can send realtime messages" ON realtime.messages;
CREATE POLICY "Admins can send realtime messages"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));