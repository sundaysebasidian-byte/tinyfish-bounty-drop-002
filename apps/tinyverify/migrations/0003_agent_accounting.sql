ALTER TABLE costs ADD COLUMN reserved_usd REAL;
ALTER TABLE costs ADD COLUMN public_ip TEXT;
ALTER TABLE costs ADD COLUMN num_of_steps INTEGER;
ALTER TABLE costs ADD COLUMN over_step_budget INTEGER NOT NULL DEFAULT 0;
UPDATE costs SET reserved_usd=usd;
