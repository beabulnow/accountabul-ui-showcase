-- Keep generated ownership, receipt, and timestamp fields server-controlled.
REVOKE UPDATE ON public.property_registrations FROM authenticated, anon;
GRANT UPDATE (
  status,
  submitter_full_name,
  relationship,
  relationship_other,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  county,
  parcel_id,
  property_type,
  public_source_notes,
  user_note,
  affirm_accurate,
  affirm_authorized,
  affirm_not_title
) ON public.property_registrations TO authenticated;

-- An anchored record must contain every public proof field shown on the receipt.
CREATE OR REPLACE FUNCTION public.enforce_anchor_proof()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'anchored' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.record_anchors a
      WHERE a.registration_id = NEW.id
        AND a.canonical_payload_hash IS NOT NULL
        AND a.xrpl_network IS NOT NULL
        AND a.xrpl_tx_hash IS NOT NULL
        AND a.validated_ledger_index IS NOT NULL
        AND a.anchored_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot mark a registration anchored without a complete validated record proof';
    END IF;
  END IF;

  IF NEW.status <> 'draft' AND NEW.submitted_at IS NULL THEN
    IF TG_OP = 'INSERT' OR OLD.status = 'draft' THEN
      NEW.submitted_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_anchor_proof() FROM PUBLIC, anon, authenticated;

-- Update the authoritative status and append its history event in one transaction.
CREATE OR REPLACE FUNCTION public.review_registration_status(
  _registration_id uuid,
  _to_status public.registration_status,
  _user_visible_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  _from_status public.registration_status;
BEGIN
  IF NOT app_private.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Registry staff authorization required' USING ERRCODE = '42501';
  END IF;

  IF _user_visible_message IS NOT NULL AND length(_user_visible_message) > 2000 THEN
    RAISE EXCEPTION 'User-visible status messages may not exceed 2000 characters';
  END IF;

  SELECT status
  INTO _from_status
  FROM public.property_registrations
  WHERE id = _registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found' USING ERRCODE = 'P0002';
  END IF;

  IF _from_status = _to_status THEN
    RAISE EXCEPTION 'Registration already has the requested status';
  END IF;

  UPDATE public.property_registrations
  SET status = _to_status
  WHERE id = _registration_id;

  INSERT INTO public.registration_status_history (
    registration_id,
    from_status,
    to_status,
    changed_by,
    user_visible_message,
    is_user_visible
  ) VALUES (
    _registration_id,
    _from_status,
    _to_status,
    auth.uid(),
    NULLIF(btrim(_user_visible_message), ''),
    true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_registration_status(uuid, public.registration_status, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_registration_status(uuid, public.registration_status, text)
  TO authenticated;
