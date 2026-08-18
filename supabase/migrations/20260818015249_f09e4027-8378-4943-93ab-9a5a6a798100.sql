-- Verifiabul ID: ecosystem apps, per-user consent, audit trail, and SSO handoff codes.

CREATE TABLE public.ecosystem_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  home_url text,
  redirect_urls text[] NOT NULL DEFAULT '{}',
  client_secret_hash text,
  is_active boolean NOT NULL DEFAULT true,
  is_first_party boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT (id, slug, name, description, home_url, is_active, is_first_party, sort_order, created_at, updated_at)
  ON public.ecosystem_apps TO authenticated;
GRANT ALL ON public.ecosystem_apps TO service_role;
ALTER TABLE public.ecosystem_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view active ecosystem apps"
  ON public.ecosystem_apps FOR SELECT TO authenticated
  USING (is_active);

CREATE TRIGGER ecosystem_apps_set_updated_at
  BEFORE UPDATE ON public.ecosystem_apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.app_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.ecosystem_apps(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT ARRAY['profile.name','profile.email','profile.phone','profile.avatar'],
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

GRANT SELECT, INSERT, UPDATE ON public.app_consents TO authenticated;
GRANT ALL ON public.app_consents TO service_role;
ALTER TABLE public.app_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own consents"
  ON public.app_consents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users create their own consents"
  ON public.app_consents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own consents"
  ON public.app_consents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER app_consents_set_updated_at
  BEFORE UPDATE ON public.app_consents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid REFERENCES public.ecosystem_apps(id) ON DELETE SET NULL,
  action text NOT NULL,
  scopes text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.consent_events TO authenticated;
GRANT ALL ON public.consent_events TO service_role;
ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own consent history"
  ON public.consent_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Consent changes are logged by trigger; clients cannot forge history rows.
CREATE OR REPLACE FUNCTION public.log_consent_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := CASE WHEN NEW.granted_at IS NOT NULL AND NEW.revoked_at IS NULL THEN 'granted' ELSE 'declined' END;
  ELSE
    IF NEW.granted_at IS NOT DISTINCT FROM OLD.granted_at
       AND NEW.revoked_at IS NOT DISTINCT FROM OLD.revoked_at
       AND NEW.scopes IS NOT DISTINCT FROM OLD.scopes THEN
      RETURN NEW;
    END IF;
    _action := CASE WHEN NEW.granted_at IS NOT NULL AND NEW.revoked_at IS NULL THEN 'granted' ELSE 'revoked' END;
  END IF;

  INSERT INTO public.consent_events (user_id, app_id, action, scopes)
  VALUES (NEW.user_id, NEW.app_id, _action, NEW.scopes);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_consent_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER app_consents_log_event
  AFTER INSERT OR UPDATE ON public.app_consents
  FOR EACH ROW EXECUTE FUNCTION public.log_consent_event();

-- One-time authorization codes for the cross-app handoff. Server-only.
CREATE TABLE public.identity_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.ecosystem_apps(id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.identity_auth_codes TO service_role;
ALTER TABLE public.identity_auth_codes ENABLE ROW LEVEL SECURITY;
-- No policies: only server-side service-role code may touch handoff codes.

CREATE INDEX identity_auth_codes_expires_idx ON public.identity_auth_codes (expires_at);

-- Marks that the user has seen the ecosystem welcome/consent screen.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ecosystem_consent_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ecosystem_consent_version text;

INSERT INTO public.ecosystem_apps (slug, name, description, home_url, is_active, sort_order)
VALUES
  ('verifiabul-registry', 'Verifiabul Registry',
   'Property record registration, verification reports and registry receipts.',
   'https://verifiabul.com', true, 10)
ON CONFLICT (slug) DO NOTHING;