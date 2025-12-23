-- Migration: Add Check Constraint for Positive Stock
-- Description: Ensures that product quantity (qtd) never drops below zero.

ALTER TABLE public.produtos
ADD CONSTRAINT check_qtd_positive CHECK (qtd >= 0);

-- Optional: If you have existing negative stock, update them to 0 first:
-- UPDATE public.produtos SET qtd = 0 WHERE qtd < 0;
