-- Store payment amounts as integer pence instead of decimal pounds.
ALTER TABLE "payments"
  ALTER COLUMN "amount" TYPE INTEGER USING ROUND("amount" * 100)::INTEGER;

ALTER TABLE "payments"
  ALTER COLUMN "amount_tendered" TYPE INTEGER USING (
    CASE
      WHEN "amount_tendered" IS NULL THEN NULL
      ELSE ROUND("amount_tendered" * 100)::INTEGER
    END
  );
