-- 1. History integrity ------------------------------------------------------
DROP POLICY IF EXISTS rsh_insert_owner_submit ON public.registration_status_history;

REVOKE INSERT ON public.registration_status_history FROM authenticated, anon;
GRANT INSERT ON public.registration_status_history TO authenticated;

CREATE POLICY rsh_insert_staff_only
  ON public.registration_status_history
  FOR INSERT TO authenticated
  WITH CHECK (app_private.is_staff(auth.uid()) AND changed_by = auth.uid());

CREATE OR REPLACE FUNCTION app_private.log_initial_registration_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.registration_status_history (
    registration_id, from_status, to_status, changed_by, is_user_visible, user_visible_message
  ) VALUES (
    NEW.id,
    NULL,
    NEW.status,
    NEW.user_id,
    true,
    CASE WHEN NEW.status = 'submitted'
      THEN 'Registration submitted for registry review.'
      ELSE 'Draft saved. Not yet submitted for review.'
    END
  );
  RETURN NULL;
END; $$;

REVOKE ALL ON FUNCTION app_private.log_initial_registration_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS registrations_log_initial_event ON public.property_registrations;
CREATE TRIGGER registrations_log_initial_event
  AFTER INSERT ON public.property_registrations
  FOR EACH ROW
  WHEN (NEW.status IN ('draft','submitted'))
  EXECUTE FUNCTION app_private.log_initial_registration_event();

-- 2. Profiles ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NULL;
END; $$;

REVOKE ALL ON FUNCTION app_private.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app_private.handle_new_user();

INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Profile email/id are authoritative auth data: no client writes at all.
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
REVOKE INSERT, DELETE ON public.profiles FROM authenticated, anon;
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

CREATE POLICY profiles_update_own_name
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Lock down existing trigger functions -----------------------------------
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_anchor_proof() FROM PUBLIC, anon, authenticated;