import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

/** Corner label (1–4) anchored to screen corners */
export function CornerMarker({ n, pos }: { n: 1 | 2 | 3 | 4; pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background/90 text-sm font-medium shadow-sm";
  const where =
    pos === "tl" ? "left-2 top-2" :
    pos === "tr" ? "right-2 top-2" :
    pos === "bl" ? "left-2 bottom-2" :
    "right-2 bottom-2";
  return <div className={[base, where].join(" ")}>{n}</div>;
}

/** Small badge for order chips */
export function OrderBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center justify-center rounded-md border px-1.5 py-0.5">{children}</span>;
}

/** Click-to-expand tile using <details>/<summary> (no client JS required) */
export function AdminTile({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-md border bg-card/50">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm
                   hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   [&::-webkit-details-marker]:hidden"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background/80 text-xs font-medium">
          {n}
        </span>
        <span className="flex-1 truncate">{label}</span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>

      <div className="px-3 pb-3 pt-0 text-sm text-muted-foreground">
        {children}
      </div>
    </details>
  );
}


/** Visually separates blocks + adds consistent spacing. */
export function Section({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <section className={["scroll-mt-24 rounded-xl border bg-card/50 p-5", last ? "" : "mb-6"].join(" ")}>
      {children}
    </section>
  );
}

/** Bigger, catchier h2 with subtle underline and anchor-friendly spacing. */
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b pb-1 text-lg font-semibold tracking-tight">
      {children}
    </h2>
  );
}

/** Clear h3 styling with rhythm to stand apart. */
export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 text-base font-semibold">{children}</h3>
  );
}

export function LegendItem({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Badge className="rounded-full px-2">{n}</Badge>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground block xl:hidden 2xl:block">{children}</p>
      </div>
    </li>
  );
}

/** Number badge used on the demo screenshot overlay */
export function Marker({ n, x, y }: { n: number; x: string; y: string }) {
  return (
    <div
      className="absolute inline-flex h-3 md:h-5 lg:h-7 w-3 md:w-5 lg:w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-[0.7rem] md:text-[1rem] lg:text-[1.2rem] font-medium shadow-sm"
      style={{ left: x, top: y }}
      aria-label={`Section ${n}`}
    >
      {n}
    </div>
  );
}