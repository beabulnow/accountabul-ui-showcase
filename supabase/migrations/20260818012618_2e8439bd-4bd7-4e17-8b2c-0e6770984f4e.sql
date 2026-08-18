REVOKE ALL ON public.profiles, public.property_registrations, public.record_anchors, public.registration_corrections, public.registration_documents, public.registration_status_history, public.staff_notes, public.staff_roles, public.verification_checks, public.verification_reports, public.verification_sources FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.registration_status_history FROM authenticated;
GRANT SELECT ON public.registration_status_history TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.record_anchors, public.verification_reports, public.staff_roles FROM authenticated;
GRANT SELECT ON public.record_anchors, public.verification_reports, public.staff_roles TO authenticated;
REVOKE UPDATE, DELETE ON public.registration_documents FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.registration_documents TO authenticated;
REVOKE DELETE ON public.profiles, public.property_registrations, public.registration_corrections, public.staff_notes, public.verification_checks, public.verification_sources FROM authenticated;