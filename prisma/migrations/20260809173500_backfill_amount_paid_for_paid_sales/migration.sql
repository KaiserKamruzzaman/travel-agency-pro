-- Sales created before amountPaid existed default to 0 regardless of
-- paymentStatus. A sale already marked PAID has, by definition, collected
-- the full sale price — backfill so the balance-due figure stays correct.
UPDATE "Sale" SET "amountPaid" = "salePrice" WHERE "paymentStatus" = 'PAID' AND "amountPaid" = 0;
