ALTER TYPE public.registration_document_type ADD VALUE IF NOT EXISTS 'property_photo';
ALTER TYPE public.registration_status ADD VALUE IF NOT EXISTS 'correction_sent';
ALTER TYPE public.registration_status ADD VALUE IF NOT EXISTS 'confirmed_by_user';

CREATE TYPE public.correction_source AS ENUM ('staff', 'engine');
CREATE TYPE public.correction_response AS ENUM ('confirmed', 'disputed');

CREATE TABLE public.registration_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.property_registrations(id) ON DELETE CASCADE,
  round integer NOT NULL DEFAULT 1,
  source public.correction_source NOT NULL DEFAULT 'staff',
  corrected_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  field_confidence jsonb,
  staff_rationale text,
  created_by uuid REFERENCES auth.users(id),
  sent_at timestamptz,
  responded_at timestamptz,
  response public.correction_response,
  dispute_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registration_id, round)
);

CREATE INDEX registration_corrections_registration_idx
  ON public.registration_corrections (registration_id);

GRANT SELECT, INSERT, UPDATE ON public.registration_corrections TO authenticated;
GRANT ALL ON public.registration_corrections TO service_role;

ALTER TABLE public.registration_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY corrections_select_owner_or_staff
  ON public.registration_corrections FOR SELECT TO authenticated
  USING (
    app_private.is_staff(auth.uid())
    OR (
      sent_at IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.property_registrations r
        WHERE r.id = registration_corrections.registration_id
          AND r.user_id = auth.uid()
      )
    )
  );

CREATE POLICY corrections_insert_staff
  ON public.registration_corrections FOR INSERT TO authenticated
  WITH CHECK (app_private.is_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY corrections_update_staff
  ON public.registration_corrections FOR UPDATE TO authenticated
  USING (app_private.is_staff(auth.uid()))
  WITH CHECK (app_private.is_staff(auth.uid()));

CREATE POLICY corrections_update_owner_response
  ON public.registration_corrections FOR UPDATE TO authenticated
  USING (
    sent_at IS NOT NULL
    AND response IS NULL
    AND EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_corrections.registration_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_corrections.registration_id
        AND r.user_id = auth.uid()
    )
  );

CREATE TRIGGER registration_corrections_set_updated_at
  BEFORE UPDATE ON public.registration_corrections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Owners may only ever write the response fields; everything else is staff-owned.
CREATE OR REPLACE FUNCTION public.guard_correction_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF app_private.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF OLD.response IS NOT NULL THEN
    RAISE EXCEPTION 'This correction has already been answered';
  END IF;

  NEW.registration_id := OLD.registration_id;
  NEW.round := OLD.round;
  NEW.source := OLD.source;
  NEW.corrected_fields := OLD.corrected_fields;
  NEW.field_confidence := OLD.field_confidence;
  NEW.staff_rationale := OLD.staff_rationale;
  NEW.created_by := OLD.created_by;
  NEW.sent_at := OLD.sent_at;
  NEW.responded_at := now();

  IF NEW.response IS NULL THEN
    RAISE EXCEPTION 'A response is required';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_correction_response() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER registration_corrections_guard_response
  BEFORE UPDATE ON public.registration_corrections
  FOR EACH ROW EXECUTE FUNCTION public.guard_correction_response();

-- Answering a correction moves the registration forward and records history.
CREATE OR REPLACE FUNCTION public.apply_correction_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_status public.registration_status;
  next_status public.registration_status;
BEGIN
  IF NEW.response IS NULL OR OLD.response IS NOT DISTINCT FROM NEW.response THEN
    RETURN NEW;
  END IF;

  SELECT status INTO previous_status
  FROM public.property_registrations
  WHERE id = NEW.registration_id;

  IF NEW.response = 'confirmed' THEN
    next_status := 'confirmed_by_user';
  ELSE
    next_status := 'needs_information';
  END IF;

  UPDATE public.property_registrations
  SET status = next_status, updated_at = now()
  WHERE id = NEW.registration_id;

  INSERT INTO public.registration_status_history (
    registration_id, from_status, to_status, changed_by, user_visible_message, is_user_visible
  ) VALUES (
    NEW.registration_id,
    previous_status,
    next_status,
    auth.uid(),
    CASE WHEN NEW.response = 'confirmed'
      THEN 'Submitter confirmed the verified record.'
      ELSE COALESCE(NULLIF(NEW.dispute_note, ''), 'Submitter reported a problem with the verified record.')
    END,
    true
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_correction_response() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER registration_corrections_apply_response
  AFTER UPDATE ON public.registration_corrections
  FOR EACH ROW EXECUTE FUNCTION public.apply_correction_response();