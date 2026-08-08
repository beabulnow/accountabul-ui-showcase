CREATE TYPE public.registration_document_type AS ENUM (
  'deed_title',
  'tax_statement',
  'mortgage_statement',
  'insurance_declaration',
  'utility_occupancy',
  'photo_id',
  'authority_document',
  'other'
);

CREATE TABLE public.registration_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.property_registrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.registration_document_type NOT NULL,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX registration_documents_registration_idx
  ON public.registration_documents (registration_id, document_type);

GRANT SELECT, INSERT, DELETE ON public.registration_documents TO authenticated;
GRANT ALL ON public.registration_documents TO service_role;

ALTER TABLE public.registration_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_documents_select_own_or_staff
  ON public.registration_documents
  FOR SELECT
  TO authenticated
  USING (
    app_private.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_documents.registration_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY registration_documents_insert_own
  ON public.registration_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_documents.registration_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY registration_documents_delete_own_editable
  ON public.registration_documents
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.property_registrations r
      WHERE r.id = registration_documents.registration_id
        AND r.user_id = auth.uid()
        AND r.status IN ('draft', 'needs_information', 'submitted')
    )
  );

-- Storage policies: object path is {user_id}/{registration_id}/{document_type}/{uuid}-{filename}
CREATE POLICY registration_docs_read_own_or_staff
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'registration-documents'
    AND (
      app_private.is_staff(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY registration_docs_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'registration-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY registration_docs_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'registration-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );