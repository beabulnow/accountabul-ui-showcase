-- 1. Column-scoped UPDATE on property_registrations
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

GRANT ALL ON public.property_registrations TO service_role;

-- 2. Harden the anchor guard: full proof required
CREATE OR REPLACE FUNCTION public.enforce_anchor_proof()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status = 'anchored' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.record_anchors a
      WHERE a.registration_id = NEW.id
        AND a.canonical_payload_hash IS NOT NULL
        AND a.xrpl_network IS NOT NULL
        AND a.xrpl_tx_hash IS NOT NULL
        AND a.validated_ledger_index IS NOT NULL
        AND a.anchored_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot mark a registration anchored without a complete validated on-chain proof (canonical hash, network, tx hash, validated ledger index, anchored timestamp)';
    END IF;
  END IF;

  IF NEW.status <> 'draft' AND NEW.submitted_at IS NULL THEN
    IF TG_OP = 'INSERT' OR OLD.status = 'draft' THEN
      NEW.submitted_at = now();
    END IF;
  END IF;

  RETURN NEW;
END; $function$;

REVOKE ALL ON FUNCTION public.enforce_anchor_proof() FROM PUBLIC, anon, authenticated;

-- 3. Single transactional staff review action (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.review_registration_status(
  _registration_id uuid,
  _to_status public.registration_status,
  _user_visible_message text DEFAULT NULL
)
RETURNS public.property_registrations
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _actor uuid := auth.uid();
  _from public.registration_status;
  _row public.property_registrations;
BEGIN
  IF _actor IS NULL OR NOT app_private.is_staff(_actor) THEN
    RAISE EXCEPTION 'Not authorized: registry staff role required';
  END IF;

  SELECT status INTO _from
  FROM public.property_registrations
  WHERE id = _registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;

  IF _from = _to_status THEN
    RAISE EXCEPTION 'Registration is already in that status';
  END IF;

  UPDATE public.property_registrations
  SET status = _to_status
  WHERE id = _registration_id
  RETURNING * INTO _row;

  INSERT INTO public.registration_status_history (
    registration_id, from_status, to_status, changed_by,
    is_user_visible, user_visible_message
  ) VALUES (
    _registration_id, _from, _to_status, _actor,
    true, nullif(btrim(coalesce(_user_visible_message, '')), '')
  );

  RETURN _row;
END; $function$;

REVOKE ALL ON FUNCTION public.review_registration_status(uuid, public.registration_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_registration_status(uuid, public.registration_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_registration_status(uuid, public.registration_status, text) TO service_role;