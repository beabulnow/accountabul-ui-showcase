-- Structured property verification workflow.
--
-- A registration is the claimant's submission. A verification report is
-- Verifiabul's review of that submission. Public findings are separated from
-- staff-only source records so a property owner never receives internal notes,
-- provider references, or evidence URLs through the Data API.

CREATE TYPE public.verification_report_status AS ENUM (
  'queued',
  'in_review',
  'needs_information',
  'verified',
  'not_verified',
  'inconclusive',
  'expired'
);

CREATE TYPE public.verification_check_kind AS ENUM (
  'identity',
  'ownership',
  'property_record',
  'deed_title',
  'tax',
  'lien',
  'encumbrance',
  'document_authenticity',
  'address',
  'other'
);

CREATE TYPE public.verification_check_outcome AS ENUM (
  'pending',
  'passed',
  'failed',
  'inconclusive',
  'not_applicable'
);

CREATE TABLE public.verification_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE
    REFERENCES public.property_registrations(id) ON DELETE CASCADE,
  report_code text NOT NULL UNIQUE
    DEFAULT 'VRF-' || to_char(now(), 'YYYY') || '-' ||
      upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  status public.verification_report_status NOT NULL DEFAULT 'queued',
  methodology_version text NOT NULL DEFAULT 'property-record-verification-v1',
  public_summary text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  review_started_at timestamptz,
  completed_at timestamptz,
  published_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_reports_methodology_length
    CHECK (length(btrim(methodology_version)) BETWEEN 1 AND 100),
  CONSTRAINT verification_reports_summary_length
    CHECK (public_summary IS NULL OR length(btrim(public_summary)) BETWEEN 1 AND 4000),
  CONSTRAINT verification_reports_terminal_completion
    CHECK (
      status NOT IN ('verified', 'not_verified', 'inconclusive', 'expired')
      OR completed_at IS NOT NULL
    ),
  CONSTRAINT verification_reports_publish_complete
    CHECK (
      published_at IS NULL
      OR (
        status IN ('verified', 'not_verified', 'inconclusive', 'expired')
        AND completed_at IS NOT NULL
        AND public_summary IS NOT NULL
      )
    ),
  CONSTRAINT verification_reports_validity_after_completion
    CHECK (valid_until IS NULL OR (completed_at IS NOT NULL AND valid_until > completed_at))
);

CREATE INDEX verification_reports_status_requested_idx
  ON public.verification_reports (status, requested_at);
CREATE INDEX verification_reports_reviewer_idx
  ON public.verification_reports (reviewer_id)
  WHERE reviewer_id IS NOT NULL;

CREATE TABLE public.verification_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL
    REFERENCES public.verification_reports(id) ON DELETE CASCADE,
  check_kind public.verification_check_kind NOT NULL,
  outcome public.verification_check_outcome NOT NULL DEFAULT 'pending',
  public_summary text,
  checked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, check_kind),
  CONSTRAINT verification_checks_summary_length
    CHECK (public_summary IS NULL OR length(btrim(public_summary)) BETWEEN 1 AND 2000),
  CONSTRAINT verification_checks_completed_fields
    CHECK (
      (outcome = 'pending' AND checked_at IS NULL AND checked_by IS NULL)
      OR
      (outcome <> 'pending' AND checked_at IS NOT NULL AND checked_by IS NOT NULL
        AND public_summary IS NOT NULL)
    )
);

CREATE INDEX verification_checks_report_outcome_idx
  ON public.verification_checks (report_id, outcome);
CREATE INDEX verification_checks_checked_by_idx
  ON public.verification_checks (checked_by)
  WHERE checked_by IS NOT NULL;

-- Source records are deliberately separate from user-visible check results.
-- Only registry staff can read or write this table.
CREATE TABLE public.verification_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL
    REFERENCES public.verification_checks(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  jurisdiction text,
  record_reference text,
  source_url text,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  content_hash text,
  staff_note text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_sources_name_length
    CHECK (length(btrim(source_name)) BETWEEN 1 AND 200),
  CONSTRAINT verification_sources_jurisdiction_length
    CHECK (jurisdiction IS NULL OR length(btrim(jurisdiction)) BETWEEN 1 AND 200),
  CONSTRAINT verification_sources_reference_length
    CHECK (record_reference IS NULL OR length(btrim(record_reference)) BETWEEN 1 AND 500),
  CONSTRAINT verification_sources_url_length
    CHECK (source_url IS NULL OR length(btrim(source_url)) BETWEEN 1 AND 2000),
  CONSTRAINT verification_sources_hash_format
    CHECK (content_hash IS NULL OR content_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT verification_sources_note_length
    CHECK (staff_note IS NULL OR length(btrim(staff_note)) BETWEEN 1 AND 4000)
);

CREATE INDEX verification_sources_check_idx
  ON public.verification_sources (check_id, retrieved_at DESC);
CREATE INDEX verification_sources_created_by_idx
  ON public.verification_sources (created_by);

ALTER TABLE public.verification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_sources ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.verification_reports TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.verification_checks TO authenticated;
GRANT UPDATE (outcome, public_summary) ON public.verification_checks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.verification_sources TO authenticated;
GRANT UPDATE (
  source_name,
  jurisdiction,
  record_reference,
  source_url,
  retrieved_at,
  content_hash,
  staff_note
) ON public.verification_sources TO authenticated;

GRANT ALL ON public.verification_reports TO service_role;
GRANT ALL ON public.verification_checks TO service_role;
GRANT ALL ON public.verification_sources TO service_role;

CREATE POLICY verification_reports_select_owner_or_staff
  ON public.verification_reports
  FOR SELECT TO authenticated
  USING (
    (select app_private.is_staff((select auth.uid())))
    OR EXISTS (
      SELECT 1
      FROM public.property_registrations registration
      WHERE registration.id = verification_reports.registration_id
        AND registration.user_id = (select auth.uid())
    )
  );

CREATE POLICY verification_checks_select_published_owner_or_staff
  ON public.verification_checks
  FOR SELECT TO authenticated
  USING (
    (select app_private.is_staff((select auth.uid())))
    OR EXISTS (
      SELECT 1
      FROM public.verification_reports report
      JOIN public.property_registrations registration
        ON registration.id = report.registration_id
      WHERE report.id = verification_checks.report_id
        AND report.published_at IS NOT NULL
        AND registration.user_id = (select auth.uid())
    )
  );

CREATE POLICY verification_checks_insert_staff
  ON public.verification_checks
  FOR INSERT TO authenticated
  WITH CHECK (
    (select app_private.is_staff((select auth.uid())))
    AND checked_by IS NULL
    AND checked_at IS NULL
    AND outcome = 'pending'
  );

CREATE POLICY verification_checks_update_staff
  ON public.verification_checks
  FOR UPDATE TO authenticated
  USING ((select app_private.is_staff((select auth.uid()))))
  WITH CHECK ((select app_private.is_staff((select auth.uid()))));

CREATE POLICY verification_checks_delete_staff
  ON public.verification_checks
  FOR DELETE TO authenticated
  USING ((select app_private.is_staff((select auth.uid()))));

CREATE POLICY verification_sources_select_staff
  ON public.verification_sources
  FOR SELECT TO authenticated
  USING ((select app_private.is_staff((select auth.uid()))));

CREATE POLICY verification_sources_insert_staff
  ON public.verification_sources
  FOR INSERT TO authenticated
  WITH CHECK (
    (select app_private.is_staff((select auth.uid())))
    AND created_by = (select auth.uid())
  );

CREATE POLICY verification_sources_update_staff
  ON public.verification_sources
  FOR UPDATE TO authenticated
  USING ((select app_private.is_staff((select auth.uid()))))
  WITH CHECK ((select app_private.is_staff((select auth.uid()))));

CREATE POLICY verification_sources_delete_staff
  ON public.verification_sources
  FOR DELETE TO authenticated
  USING ((select app_private.is_staff((select auth.uid()))));

CREATE TRIGGER verification_reports_set_updated_at
  BEFORE UPDATE ON public.verification_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER verification_checks_set_updated_at
  BEFORE UPDATE ON public.verification_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION app_private.prepare_verification_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.outcome = 'pending' THEN
    NEW.checked_by = NULL;
    NEW.checked_at = NULL;
    NEW.public_summary = NULL;
  ELSE
    NEW.checked_by = COALESCE(auth.uid(), NEW.checked_by);
    NEW.checked_at = COALESCE(NEW.checked_at, now());
    NEW.public_summary = NULLIF(btrim(NEW.public_summary), '');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app_private.prepare_verification_check()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER verification_checks_prepare
  BEFORE INSERT OR UPDATE ON public.verification_checks
  FOR EACH ROW EXECUTE FUNCTION app_private.prepare_verification_check();

CREATE OR REPLACE FUNCTION app_private.create_initial_verification_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _report_id uuid;
BEGIN
  INSERT INTO public.verification_reports (registration_id)
  VALUES (NEW.id)
  ON CONFLICT (registration_id) DO NOTHING
  RETURNING id INTO _report_id;

  IF _report_id IS NULL THEN
    SELECT id INTO _report_id
    FROM public.verification_reports
    WHERE registration_id = NEW.id;
  END IF;

  INSERT INTO public.verification_checks (report_id, check_kind)
  VALUES
    (_report_id, 'ownership'),
    (_report_id, 'property_record'),
    (_report_id, 'deed_title'),
    (_report_id, 'tax'),
    (_report_id, 'lien'),
    (_report_id, 'encumbrance')
  ON CONFLICT (report_id, check_kind) DO NOTHING;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app_private.create_initial_verification_report()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER registrations_create_verification_report
  AFTER INSERT ON public.property_registrations
  FOR EACH ROW EXECUTE FUNCTION app_private.create_initial_verification_report();

-- Every existing registration receives a report without altering its current
-- workflow status or history.
INSERT INTO public.verification_reports (registration_id, requested_at)
SELECT registration.id, COALESCE(registration.submitted_at, registration.created_at)
FROM public.property_registrations registration
ON CONFLICT (registration_id) DO NOTHING;

INSERT INTO public.verification_checks (report_id, check_kind)
SELECT report.id, required_check.check_kind
FROM public.verification_reports report
CROSS JOIN (
  VALUES
    ('ownership'::public.verification_check_kind),
    ('property_record'::public.verification_check_kind),
    ('deed_title'::public.verification_check_kind),
    ('tax'::public.verification_check_kind),
    ('lien'::public.verification_check_kind),
    ('encumbrance'::public.verification_check_kind)
) AS required_check(check_kind)
ON CONFLICT (report_id, check_kind) DO NOTHING;

-- Progress changes use a narrow function so authenticated clients never
-- receive direct UPDATE privileges on verification_reports.
CREATE OR REPLACE FUNCTION public.set_verification_report_progress(
  _report_id uuid,
  _status public.verification_report_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT app_private.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Registry staff authorization required' USING ERRCODE = '42501';
  END IF;

  IF _status NOT IN ('queued', 'in_review', 'needs_information') THEN
    RAISE EXCEPTION 'Use publish_verification_report for final outcomes';
  END IF;

  UPDATE public.verification_reports
  SET
    status = _status,
    reviewer_id = CASE WHEN _status = 'queued' THEN reviewer_id ELSE auth.uid() END,
    review_started_at = CASE
      WHEN _status = 'queued' THEN review_started_at
      ELSE COALESCE(review_started_at, now())
    END
  WHERE id = _report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification report not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_verification_report_progress(
  uuid,
  public.verification_report_status
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_verification_report_progress(
  uuid,
  public.verification_report_status
) TO authenticated;

-- Publish a final result and update the registration status/history in the
-- same transaction. A verified report requires all six core record checks to
-- pass. Failed or inconclusive results must be supported by a matching check.
CREATE OR REPLACE FUNCTION public.publish_verification_report(
  _report_id uuid,
  _outcome public.verification_report_status,
  _public_summary text,
  _valid_until timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _registration_id uuid;
  _required_count integer;
  _passed_count integer;
  _failed_count integer;
  _inconclusive_count integer;
  _sourced_count integer;
  _registration_status public.registration_status;
  _history_message text;
BEGIN
  IF NOT app_private.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Registry staff authorization required' USING ERRCODE = '42501';
  END IF;

  IF _outcome NOT IN ('verified', 'not_verified', 'inconclusive') THEN
    RAISE EXCEPTION 'A published report must be verified, not verified, or inconclusive';
  END IF;

  _public_summary := NULLIF(btrim(_public_summary), '');
  IF _public_summary IS NULL OR length(_public_summary) > 4000 THEN
    RAISE EXCEPTION 'A public summary between 1 and 4000 characters is required';
  END IF;

  IF _valid_until IS NOT NULL AND _valid_until <= now() THEN
    RAISE EXCEPTION 'Report validity must end in the future';
  END IF;

  SELECT report.registration_id
    INTO _registration_id
  FROM public.verification_reports report
  WHERE report.id = _report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification report not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT
    count(*) FILTER (
      WHERE check_result.check_kind IN (
        'ownership', 'property_record', 'deed_title', 'tax', 'lien', 'encumbrance'
      )
      AND check_result.outcome <> 'pending'
    ),
    count(*) FILTER (
      WHERE check_result.check_kind IN (
        'ownership', 'property_record', 'deed_title', 'tax', 'lien', 'encumbrance'
      )
      AND check_result.outcome = 'passed'
    ),
    count(*) FILTER (WHERE check_result.outcome = 'failed'),
    count(*) FILTER (WHERE check_result.outcome = 'inconclusive'),
    count(*) FILTER (
      WHERE check_result.check_kind IN (
        'ownership', 'property_record', 'deed_title', 'tax', 'lien', 'encumbrance'
      )
      AND EXISTS (
        SELECT 1
        FROM public.verification_sources source_record
        WHERE source_record.check_id = check_result.id
      )
    )
  INTO _required_count, _passed_count, _failed_count, _inconclusive_count, _sourced_count
  FROM public.verification_checks check_result
  WHERE check_result.report_id = _report_id;

  IF _required_count <> 6 THEN
    RAISE EXCEPTION 'Complete the six required property record checks before publishing';
  END IF;

  IF _sourced_count <> 6 THEN
    RAISE EXCEPTION 'Add at least one source record to each required check before publishing';
  END IF;

  IF _outcome = 'verified' AND _passed_count <> 6 THEN
    RAISE EXCEPTION 'A verified report requires all six property record checks to pass';
  ELSIF _outcome = 'not_verified' AND _failed_count = 0 THEN
    RAISE EXCEPTION 'A not verified report requires at least one failed check';
  ELSIF _outcome = 'inconclusive' AND (_inconclusive_count = 0 OR _failed_count > 0) THEN
    RAISE EXCEPTION 'An inconclusive report requires at least one inconclusive check';
  END IF;

  UPDATE public.verification_reports
  SET
    status = _outcome,
    public_summary = _public_summary,
    reviewer_id = auth.uid(),
    review_started_at = COALESCE(review_started_at, now()),
    completed_at = now(),
    published_at = now(),
    valid_until = _valid_until
  WHERE id = _report_id;

  IF _outcome = 'verified' THEN
    _registration_status := 'approved';
    _history_message := 'Property record verification completed. The submitted record was verified.';
  ELSIF _outcome = 'not_verified' THEN
    _registration_status := 'rejected';
    _history_message := 'Property record verification completed. The submitted record could not be verified.';
  ELSE
    _registration_status := 'needs_information';
    _history_message := 'Property record verification is inconclusive. Additional information is required.';
  END IF;

  PERFORM public.review_registration_status(
    _registration_id,
    _registration_status,
    _history_message
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_verification_report(
  uuid,
  public.verification_report_status,
  text,
  timestamptz
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.publish_verification_report(
  uuid,
  public.verification_report_status,
  text,
  timestamptz
) TO authenticated;

COMMENT ON TABLE public.verification_reports IS
  'One structured Verifiabul review per submitted property registration.';
COMMENT ON TABLE public.verification_checks IS
  'User-visible outcomes for individual property verification checks.';
COMMENT ON TABLE public.verification_sources IS
  'Staff-only sources and evidence supporting verification check outcomes.';