-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Update orders table
ALTER TABLE public.orders RENAME COLUMN phone TO whatsapp;
ALTER TABLE public.orders ADD COLUMN order_number TEXT;
ALTER TABLE public.orders ADD COLUMN items_preview JSONB;

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'KL-' || LPAD(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order number
CREATE TRIGGER tr_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();
