import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { initialsFor, PROFILE_AVATAR_BUCKET } from "@/lib/profile";

export function ProfileAvatar({
  avatarPath,
  name,
  className = "size-12",
  previewUrl,
}: {
  avatarPath?: string | null;
  name?: string | null;
  className?: string;
  previewUrl?: string | null;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSignedUrl(null);
    if (!avatarPath || previewUrl) return;

    supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .createSignedUrl(avatarPath, 60 * 60)
      .then(({ data }) => {
        if (active) setSignedUrl(data?.signedUrl ?? null);
      });

    return () => {
      active = false;
    };
  }, [avatarPath, previewUrl]);

  const src = previewUrl || signedUrl;

  return (
    <span
      className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-accent font-medium text-foreground`}
      aria-label={name ? `${name}'s profile photo` : "Profile photo"}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsFor(name)}</span>
      )}
    </span>
  );
}
