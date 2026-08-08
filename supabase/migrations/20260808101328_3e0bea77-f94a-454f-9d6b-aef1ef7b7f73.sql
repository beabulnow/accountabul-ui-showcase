-- Private allowlist: which email addresses should receive registry staff access.
-- Lives in app_private so it is unreachable from the Data API.
CREATE TABLE IF NOT EXISTS app_private.staff_email_allowlist (
  email text PRIMARY KEY,
  role public.staff_role NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON app_private.staff_email_allowlist FROM PUBLIC, anon, authenticated;

INSERT INTO app_private.staff_email_allowlist (email, role)
VALUES ('seantha1da@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Grants the allowlisted role for one user, but only when that user's email
-- is actually confirmed. Unverified addresses can never escalate.
CREATE OR REPLACE FUNCTION app_private.grant_allowlisted_staff_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  _email text;
  _confirmed timestamptz;
  _role public.staff_role;
BEGIN
  SELECT lower(u.email), u.email_confirmed_at
    INTO _email, _confirmed
  FROM auth.users u
  WHERE u.id = _user_id;

  IF _email IS NULL OR _confirmed IS NULL THEN
    RETURN;
  END IF;

  SELECT a.role INTO _role
  FROM app_private.staff_email_allowlist a
  WHERE a.email = _email;

  IF _role IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.staff_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION app_private.grant_allowlisted_staff_role(uuid) FROM PUBLIC, anon, authenticated;

-- Profile creation on signup now also applies the allowlist.
CREATE OR REPLACE FUNCTION app_private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  PERFORM app_private.grant_allowlisted_staff_role(NEW.id);

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app_private.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Callable by the signed-in user only for themselves: picks up an allowlisted
-- role after email confirmation (e.g. account created before the allowlist entry).
CREATE OR REPLACE FUNCTION public.sync_staff_access()
RETURNS public.staff_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
  _role public.staff_role;
BEGIN
  IF _actor IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM app_private.grant_allowlisted_staff_role(_actor);

  SELECT sr.role INTO _role
  FROM public.staff_roles sr
  WHERE sr.user_id = _actor
  ORDER BY (sr.role = 'admin') DESC
  LIMIT 1;

  RETURN _role;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_staff_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_staff_access() TO authenticated;