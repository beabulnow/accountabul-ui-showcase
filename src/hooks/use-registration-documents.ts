import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  REGISTRATION_DOCUMENTS_BUCKET,
  buildDocumentStoragePath,
  type PendingDocuments,
  type RegistrationDocument,
  type RegistrationDocumentType,
} from "@/lib/documents";

/**
 * Documents attached to one registration. RLS decides visibility: owners see
 * their own, staff see every submission's documents.
 */
export function useRegistrationDocuments(registrationId: string | null | undefined) {
  return useQuery({
    queryKey: ["registration-documents", registrationId],
    enabled: Boolean(registrationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_documents")
        .select("*")
        .eq("registration_id", registrationId!)
        .order("uploaded_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RegistrationDocument[];
    },
  });
}

export type UploadFailure = { fileName: string; message: string };

/**
 * Uploads files to storage and records one row per file. Runs after the
 * registration row exists so every object has a real registration id. A failed
 * file is reported back rather than rolling back the saved record.
 */
export async function uploadRegistrationDocuments(input: {
  userId: string;
  registrationId: string;
  documents: PendingDocuments;
}): Promise<{ uploaded: number; failures: UploadFailure[] }> {
  const failures: UploadFailure[] = [];
  let uploaded = 0;

  for (const [documentType, files] of Object.entries(input.documents)) {
    for (const file of files ?? []) {
      const storagePath = buildDocumentStoragePath({
        userId: input.userId,
        registrationId: input.registrationId,
        documentType: documentType as RegistrationDocumentType,
        fileName: file.name,
      });

      const { error: uploadError } = await supabase.storage
        .from(REGISTRATION_DOCUMENTS_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        failures.push({ fileName: file.name, message: uploadError.message });
        continue;
      }

      const { error: rowError } = await supabase.from("registration_documents").insert({
        registration_id: input.registrationId,
        user_id: input.userId,
        document_type: documentType as RegistrationDocumentType,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        byte_size: file.size,
      });

      if (rowError) {
        // Don't leave an orphaned object behind if the row could not be written.
        await supabase.storage.from(REGISTRATION_DOCUMENTS_BUCKET).remove([storagePath]);
        failures.push({ fileName: file.name, message: rowError.message });
        continue;
      }

      uploaded += 1;
    }
  }

  return { uploaded, failures };
}

/** Removes the stored object first, then its record row. */
export async function deleteRegistrationDocument(document: RegistrationDocument) {
  const { error: storageError } = await supabase.storage
    .from(REGISTRATION_DOCUMENTS_BUCKET)
    .remove([document.storage_path]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("registration_documents").delete().eq("id", document.id);
  if (error) throw error;
}

/** Short-lived signed URL — nothing in this bucket is public. */
export async function signedDocumentUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(REGISTRATION_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}
