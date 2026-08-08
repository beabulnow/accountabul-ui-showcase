export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="font-display text-xl">Verifiabul</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A property verification registry. Records are submitted by people, reviewed by staff, and
          can later carry a tamper-evident record proof published by Verifiabul.
        </p>
      </div>
      <div className="border-t border-border px-5 py-5">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          Registration is not legal title, a deed, title insurance, an appraisal, or proof of
          ownership. © {new Date().getFullYear()} Verifiabul.
        </p>
      </div>
    </footer>
  );
}
