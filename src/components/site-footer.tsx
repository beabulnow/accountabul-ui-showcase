export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="font-display text-xl">Accountabul</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Evidence-first property discovery. Every claim carries a source, a date and a verified name.
        </p>
      </div>
      <div className="border-t border-border px-5 py-5">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          Interface preview — not connected to live data. © {new Date().getFullYear()} Accountabul.
        </p>
      </div>
    </footer>
  );
}
