
-- 1. Allowlist: single owner account only
DELETE FROM app_private.staff_email_allowlist WHERE email <> 'jibreelm.dev@gmail.com';
INSERT INTO app_private.staff_email_allowlist (email, role)
VALUES ('jibreelm.dev@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- 2. Grant only for allowlisted, email-confirmed, Google-authenticated users
CREATE OR REPLACE FUNCTION app_private.grant_allowlisted_staff_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  _email text;
  _confirmed timestamptz;
  _is_google boolean;
  _role public.staff_role;
BEGIN
  SELECT lower(u.email),
         u.email_confirmed_at,
         COALESCE(u.raw_app_meta_data->>'provider', '') = 'google'
           OR COALESCE(u.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google'
    INTO _email, _confirmed, _is_google
  FROM auth.users u
  WHERE u.id = _user_id;

  IF _email IS NULL OR _confirmed IS NULL OR NOT _is_google THEN
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

-- 3. Hard guard: staff_roles rows may only exist for allowlisted Google accounts
CREATE OR REPLACE FUNCTION app_private.enforce_staff_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  _ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN app_private.staff_email_allowlist a ON a.email = lower(u.email)
    WHERE u.id = NEW.user_id
      AND u.email_confirmed_at IS NOT NULL
      AND (
        COALESCE(u.raw_app_meta_data->>'provider', '') = 'google'
        OR COALESCE(u.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google'
      )
      AND a.role = NEW.role
  ) INTO _ok;

  IF NOT _ok THEN
    RAISE EXCEPTION 'Registry staff access is restricted to allowlisted Google accounts';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS staff_roles_enforce_allowlist ON public.staff_roles;
CREATE TRIGGER staff_roles_enforce_allowlist
BEFORE INSERT OR UPDATE ON public.staff_roles
FOR EACH ROW EXECUTE FUNCTION app_private.enforce_staff_allowlist();

-- 4. Remove any staff role that is not the owner account
DELETE FROM public.staff_roles sr
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users u
  JOIN app_private.staff_email_allowlist a ON a.email = lower(u.email)
  WHERE u.id = sr.user_id
);
