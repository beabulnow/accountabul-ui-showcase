-- Account profile onboarding and private avatar storage.
-- Existing users remain valid and are prompted to complete the new fields.

ALTER TABLE public.profiles
  ADD COLUMN first_name text,
  ADD COLUMN middle_name text,
  ADD COLUMN last_name text,
  ADD COLUMN date_of_birth date,
  ADD COLUMN phone_e164 text,
  ADD COLUMN phone_verified_at timestamptz,
  ADD COLUMN bio text,
  ADD COLUMN avatar_path text,
  ADD COLUMN profile_completed_at timestamptz,
  ADD COLUMN privacy_accepted_at timestamptz,
  ADD COLUMN privacy_policy_version text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_first_name_length
    CHECK (first_name IS NULL OR length(btrim(first_name)) BETWEEN 1 AND 80),
  ADD CONSTRAINT profiles_middle_name_length
    CHECK (middle_name IS NULL OR length(btrim(middle_name)) BETWEEN 1 AND 80),
  ADD CONSTRAINT profiles_last_name_length
    CHECK (last_name IS NULL OR length(btrim(last_name)) BETWEEN 1 AND 80),
  ADD CONSTRAINT profiles_date_of_birth_range
    CHECK (date_of_birth IS NULL OR date_of_birth BETWEEN DATE '1900-01-01' AND CURRENT_DATE),
  ADD CONSTRAINT profiles_phone_e164_format
    CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  ADD CONSTRAINT profiles_bio_length
    CHECK (bio IS NULL OR length(bio) <= 500),
  ADD CONSTRAINT profiles_avatar_path_owner
    CHECK (avatar_path IS NULL OR avatar_path = id::text || '/avatar'),
  ADD CONSTRAINT profiles_privacy_acceptance_complete
    CHECK (
      (privacy_accepted_at IS NULL AND privacy_policy_version IS NULL)
      OR (
        privacy_accepted_at IS NOT NULL
        AND privacy_policy_version = 'profile-notice-v1'
      )
    );

-- Completion and the display-name snapshot are derived from the fields the
-- account holder submits. Clients cannot write profile_completed_at or
-- full_name directly.
CREATE OR REPLACE FUNCTION public.sync_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.first_name = NULLIF(btrim(NEW.first_name), '');
  NEW.middle_name = NULLIF(btrim(NEW.middle_name), '');
  NEW.last_name = NULLIF(btrim(NEW.last_name), '');
  NEW.phone_e164 = NULLIF(btrim(NEW.phone_e164), '');
  NEW.bio = NULLIF(btrim(NEW.bio), '');

  IF OLD.privacy_accepted_at IS NULL
    AND NEW.privacy_policy_version = 'profile-notice-v1'
  THEN
    NEW.privacy_accepted_at = now();
  ELSIF OLD.privacy_accepted_at IS NOT NULL THEN
    NEW.privacy_accepted_at = OLD.privacy_accepted_at;
    NEW.privacy_policy_version = OLD.privacy_policy_version;
  END IF;

  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.full_name = concat_ws(' ', NEW.first_name, NEW.middle_name, NEW.last_name);
  END IF;

  IF NEW.first_name IS NOT NULL
    AND NEW.last_name IS NOT NULL
    AND NEW.date_of_birth IS NOT NULL
    AND NEW.phone_e164 IS NOT NULL
    AND NEW.privacy_accepted_at IS NOT NULL
    AND NEW.privacy_policy_version IS NOT NULL
  THEN
    NEW.profile_completed_at = COALESCE(OLD.profile_completed_at, now());
  ELSE
    NEW.profile_completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_completion() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_sync_completion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_completion();

REVOKE UPDATE (full_name) ON public.profiles FROM authenticated;
GRANT UPDATE (
  first_name,
  middle_name,
  last_name,
  date_of_birth,
  phone_e164,
  bio,
  avatar_path,
  privacy_policy_version
) ON public.profiles TO authenticated;

-- Private, image-only profile photos. Access is restricted again at the
-- object level so each account can only manage its own avatar path.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY profile_avatars_select_own_or_staff
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR app_private.is_staff((select auth.uid()))
    )
  );

CREATE POLICY profile_avatars_insert_own
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND name = (select auth.uid())::text || '/avatar'
  );

CREATE POLICY profile_avatars_update_own
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND name = (select auth.uid())::text || '/avatar'
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND name = (select auth.uid())::text || '/avatar'
  );

CREATE POLICY profile_avatars_delete_own
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND name = (select auth.uid())::text || '/avatar'
  );
