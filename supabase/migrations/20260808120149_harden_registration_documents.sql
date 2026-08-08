-- Keep property evidence private and enforce the same limits at the storage
-- and database layers that the browser presents to users.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registration-documents',
  'registration-documents',
  false,
  15728640,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.registration_documents
  ADD CONSTRAINT registration_documents_file_name_length
    CHECK (length(btrim(file_name)) BETWEEN 1 AND 255) NOT VALID,
  ADD CONSTRAINT registration_documents_mime_type_allowed
    CHECK (mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif'
    )) NOT VALID,
  ADD CONSTRAINT registration_documents_byte_size_allowed
    CHECK (byte_size BETWEEN 1 AND 15728640) NOT VALID,
  ADD CONSTRAINT registration_documents_storage_path_matches_row
    CHECK (
      storage_path ~ (
        '^' || user_id::text || '/' || registration_id::text || '/' ||
        document_type::text || '/[^/]+$'
      )
    ) NOT VALID;

DROP POLICY IF EXISTS registration_documents_insert_own
  ON public.registration_documents;

CREATE POLICY registration_documents_insert_own_editable
  ON public.registration_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND storage_path ~ (
      '^' || (select auth.uid())::text || '/' || registration_id::text || '/' ||
      document_type::text || '/[^/]+$'
    )
    AND EXISTS (
      SELECT 1
      FROM public.property_registrations r
      WHERE r.id = registration_documents.registration_id
        AND r.user_id = (select auth.uid())
        AND r.status IN ('draft', 'needs_information', 'submitted')
    )
  );

DROP POLICY IF EXISTS registration_docs_read_own_or_staff ON storage.objects;
DROP POLICY IF EXISTS registration_docs_insert_own ON storage.objects;
DROP POLICY IF EXISTS registration_docs_delete_own ON storage.objects;

CREATE POLICY registration_docs_read_own_or_staff
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'registration-documents'
    AND EXISTS (
      SELECT 1
      FROM public.property_registrations r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND (
          app_private.is_staff((select auth.uid()))
          OR r.user_id = (select auth.uid())
        )
    )
  );

CREATE POLICY registration_docs_insert_own_editable
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'registration-documents'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
    AND (storage.foldername(name))[3] IN (
      'deed_title',
      'tax_statement',
      'mortgage_statement',
      'insurance_declaration',
      'utility_occupancy',
      'photo_id',
      'authority_document',
      'other'
    )
    AND EXISTS (
      SELECT 1
      FROM public.property_registrations r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND r.user_id = (select auth.uid())
        AND r.status IN ('draft', 'needs_information', 'submitted')
    )
  );

CREATE POLICY registration_docs_delete_own_editable
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'registration-documents'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
    AND EXISTS (
      SELECT 1
      FROM public.property_registrations r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND r.user_id = (select auth.uid())
        AND r.status IN ('draft', 'needs_information', 'submitted')
    )
  );
