GRANT SELECT ON public.ecosystem_apps TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.app_consents TO authenticated;
GRANT SELECT ON public.consent_events TO authenticated;
GRANT ALL ON public.ecosystem_apps TO service_role;
GRANT ALL ON public.app_consents TO service_role;
GRANT ALL ON public.consent_events TO service_role;
GRANT ALL ON public.identity_auth_codes TO service_role;