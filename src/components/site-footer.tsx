import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <p className="font-display text-xl">Accountabul</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Evidence-first property discovery. Every claim carries a source, a date and a verified name.
          </p>
        </div>
        <FooterCol
          title="Discover"
          links={[
            { to: "/properties", label: "Properties" },
            { to: "/professionals", label: "Professionals" },
          ]}
        />
        <FooterCol
          title="Trust"
          links={[
            { to: "/trust", label: "Trust center" },
            { to: "/trust", label: "Verification checks" },
          ]}
        />
        <FooterCol
          title="Product"
          links={[
            { to: "/dashboard", label: "Workspace" },
            { to: "/", label: "Overview" },
          ]}
        />
      </div>
      <div className="border-t border-border px-5 py-5">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          Demo interface with representative data. © {new Date().getFullYear()} Accountabul.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l, i) => (
          <li key={`${l.to}-${i}`}>
            <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
