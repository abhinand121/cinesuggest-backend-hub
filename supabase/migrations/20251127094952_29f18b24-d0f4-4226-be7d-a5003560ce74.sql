-- Fix security warnings

-- Add RLS policy for guest_users table
CREATE POLICY "Guest users are viewable by everyone" ON public.guest_users FOR SELECT USING (true);
CREATE POLICY "Anyone can create guest users" ON public.guest_users FOR INSERT WITH CHECK (true);

-- Fix function search_path for handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;