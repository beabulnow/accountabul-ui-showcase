-- ============ enums ============
CREATE TYPE public.registration_status AS ENUM (
  'draft','submitted','under_review','needs_information','approved','anchoring','anchored','rejected'
);
CREATE TYPE public.staff_role AS ENUM ('admin','reviewer');
CREATE TYPE public.submitter_relationship AS ENUM ('owner','authorized_representative','property_professional','other');
CREATE TYPE public.property_type AS ENUM ('single_family','multi_family','condo','townhouse','land','commercial','mixed_use','other');

-- ============ private helpers ============
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ staff_roles ============
CREATE TABLE public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
-- deliberately no INSERT/UPDATE/DELETE grant for app users
GRANT SELECT ON public.staff_roles TO authenticated;
GRANT ALL ON public.staff_roles TO service_role;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX staff_roles_user_id_idx ON public.staff_roles (user_id);

CREATE OR REPLACE FUNCTION app_private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_roles sr WHERE sr.user_id = _user_id);
$$;
CREATE OR REPLACE FUNCTION app_private.has_staff_role(_user_id uuid, _role public.staff_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_roles sr WHERE sr.user_id = _user_id AND sr.role = _role);
$$;
REVOKE ALL ON FUNCTION app_private.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.has_staff_role(uuid, public.staff_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.has_staff_role(uuid, public.staff_role) TO authenticated, service_role;

-- ============ property_registrations ============
CREATE TABLE public.property_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_code text NOT NULL UNIQUE
    DEFAULT 'ACB-' || to_char(now(),'YYYY') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  status public.registration_status NOT NULL DEFAULT 'draft',
  submitter_full_name text NOT NULL CHECK (length(btrim(submitter_full_name)) BETWEEN 2 AND 120),
  relationship public.submitter_relationship NOT NULL,
  relationship_other text CHECK (relationship_other IS NULL OR length(relationship_other) <= 160),
  address_line1 text NOT NULL CHECK (length(btrim(address_line1)) BETWEEN 3 AND 200),
  address_line2 text CHECK (address_line2 IS NULL OR length(address_line2) <= 200),
  city text NOT NULL CHECK (length(btrim(city)) BETWEEN 2 AND 120),
  state text NOT NULL DEFAULT 'MO' CHECK (length(btrim(state)) BETWEEN 2 AND 60),
  postal_code text NOT NULL CHECK (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  county text NOT NULL CHECK (length(btrim(county)) BETWEEN 2 AND 120),
  parcel_id text CHECK (parcel_id IS NULL OR length(parcel_id) <= 80),
  property_type public.property_type NOT NULL,
  public_source_notes text CHECK (public_source_notes IS NULL OR length(public_source_notes) <= 4000),
  user_note text CHECK (user_note IS NULL OR length(user_note) <= 4000),
  affirm_accurate boolean NOT NULL DEFAULT false,
  affirm_authorized boolean NOT NULL DEFAULT false,
  affirm_not_title boolean NOT NULL DEFAULT false,
  normalized_address text GENERATED ALWAYS AS (
    lower(regexp_replace(btrim(address_line1) || ' ' || btrim(city) || ' ' || btrim(state) || ' ' || btrim(postal_code), '\s+', ' ', 'g'))
  ) STORED,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affirmations_required_when_submitted CHECK (
    status = 'draft' OR (affirm_accurate AND affirm_authorized AND affirm_not_title)
  )
);
GRANT SELECT, INSERT, UPDATE ON public.property_registrations TO authenticated;
GRANT ALL ON public.property_registrations TO service_role;
ALTER TABLE public.property_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX property_registrations_user_id_idx ON public.property_registrations (user_id);
CREATE INDEX property_registrations_status_idx ON public.property_registrations (status);
CREATE INDEX property_registrations_parcel_id_idx ON public.property_registrations (parcel_id);
CREATE INDEX property_registrations_created_at_idx ON public.property_registrations (created_at DESC);
CREATE INDEX property_registrations_normalized_address_idx ON public.property_registrations (normalized_address);

-- ============ registration_status_history ============
CREATE TABLE public.registration_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.property_registrations(id) ON DELETE CASCADE,
  from_status public.registration_status,
  to_status public.registration_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_visible_message text CHECK (user_visible_message IS NULL OR length(user_visible_message) <= 2000),
  is_user_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.registration_status_history TO authenticated;
GRANT ALL ON public.registration_status_history TO service_role;
ALTER TABLE public.registration_status_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX rsh_registration_id_idx ON public.registration_status_history (registration_id, created_at DESC);

-- ============ staff_notes ============
CREATE TABLE public.staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.property_registrations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.staff_notes TO authenticated;
GRANT ALL ON public.staff_notes TO service_role;
ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX staff_notes_registration_id_idx ON public.staff_notes (registration_id, created_at DESC);

-- ============ record_anchors ============
CREATE TABLE public.record_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.property_registrations(id) ON DELETE CASCADE,
  canonical_payload_hash text CHECK (canonical_payload_hash IS NULL OR canonical_payload_hash ~ '^[0-9a-f]{64}$'),
  xrpl_network text CHECK (xrpl_network IS NULL OR xrpl_network IN ('mainnet','testnet','devnet')),
  xrpl_tx_hash text CHECK (xrpl_tx_hash IS NULL OR xrpl_tx_hash ~ '^[0-9A-F]{64}$'),
  validated_ledger_index bigint CHECK (validated_ledger_index IS NULL OR validated_ledger_index > 0),
  anchored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- read-only for app users; writes happen server-side only
GRANT SELECT ON public.record_anchors TO authenticated;
GRANT ALL ON public.record_anchors TO service_role;
ALTER TABLE public.record_anchors ENABLE ROW LEVEL SECURITY;
CREATE INDEX record_anchors_registration_id_idx ON public.record_anchors (registration_id);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER registrations_set_updated_at BEFORE UPDATE ON public.property_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER anchors_set_updated_at BEFORE UPDATE ON public.record_anchors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ anchored status guard ============
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
  IF NEW.status <> 'draft' AND OLD.status = 'draft' AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at = now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER registrations_enforce_anchor_proof
BEFORE INSERT OR UPDATE ON public.property_registrations
FOR EACH ROW EXECUTE FUNCTION public.enforce_anchor_proof();

-- ============ RLS: profiles ============
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR app_private.is_staff(auth.uid()));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============ RLS: staff_roles ============
CREATE POLICY staff_roles_select_own ON public.staff_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR app_private.has_staff_role(auth.uid(), 'admin'));

-- ============ RLS: property_registrations ============
CREATE POLICY registrations_select_own_or_staff ON public.property_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR app_private.is_staff(auth.uid()));
CREATE POLICY registrations_insert_own ON public.property_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status IN ('draft','submitted'));
CREATE POLICY registrations_update_own_draft ON public.property_registrations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('draft','needs_information'))
  WITH CHECK (user_id = auth.uid() AND status IN ('draft','submitted'));
CREATE POLICY registrations_update_staff ON public.property_registrations FOR UPDATE TO authenticated
  USING (app_private.is_staff(auth.uid())) WITH CHECK (app_private.is_staff(auth.uid()));

-- ============ RLS: registration_status_history ============
CREATE POLICY rsh_select_own_visible_or_staff ON public.registration_status_history FOR SELECT TO authenticated
  USING (
    app_private.is_staff(auth.uid())
    OR (is_user_visible AND EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    ))
  );
CREATE POLICY rsh_insert_owner_submit ON public.registration_status_history FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid() AND (
      app_private.is_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.property_registrations r
        WHERE r.id = registration_id AND r.user_id = auth.uid()
      )
    )
  );

-- ============ RLS: staff_notes ============
CREATE POLICY staff_notes_select_staff ON public.staff_notes FOR SELECT TO authenticated
  USING (app_private.is_staff(auth.uid()));
CREATE POLICY staff_notes_insert_staff ON public.staff_notes FOR INSERT TO authenticated
  WITH CHECK (app_private.is_staff(auth.uid()) AND author_id = auth.uid());

-- ============ RLS: record_anchors ============
CREATE POLICY anchors_select_own_or_staff ON public.record_anchors FOR SELECT TO authenticated
  USING (
    app_private.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    )
  );