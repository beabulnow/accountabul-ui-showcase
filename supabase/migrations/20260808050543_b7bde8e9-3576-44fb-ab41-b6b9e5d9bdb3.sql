CREATE OR REPLACE FUNCTION public.enforce_anchor_proof()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.status = 'anchored' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.record_anchors a
      WHERE a.registration_id = NEW.id
        AND a.xrpl_tx_hash IS NOT NULL
        AND a.validated_ledger_index IS NOT NULL
        AND a.canonical_payload_hash IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot mark a registration anchored without a validated on-chain proof record';
    END IF;
  END IF;

  IF NEW.status <> 'draft' AND NEW.submitted_at IS NULL THEN
    IF TG_OP = 'INSERT' OR OLD.status = 'draft' THEN
      NEW.submitted_at = now();
    END IF;
  END IF;

  RETURN NEW;
END; $$;