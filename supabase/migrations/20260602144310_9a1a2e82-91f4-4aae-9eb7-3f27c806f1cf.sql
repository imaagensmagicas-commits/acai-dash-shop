-- Add sequential_id to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sequential_id SERIAL;

-- Create an index for the sequential_id
CREATE INDEX IF NOT EXISTS idx_orders_sequential_id ON public.orders(sequential_id);
