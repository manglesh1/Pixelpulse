"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
const TroubleshootingContext = createContext<TroubleshootingQA[]>([]);
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, LinkIcon, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTroubleshootingForPath } from "./TrobleshootingContext";

/**
 * Troubleshooting Q&A types (multi-link capable)
 */
export interface TroubleshootingQA {
  id: string;
  question: string;
  answer: string;
  /** Use path-like identifiers for easy filtering per page */
  relatedPages: string[]; // e.g., "/documentation/software/gameSelection"
  /**
   * One or more links to relevant pages/sections.
   * Use label for display text and optional section for deep-linking.
   */
  links?: { href: string; label: string; section?: string }[];
  /** Deprecated single-link fields (kept for backward-compat). */
  link?: string;
  section?: string;
  /** 0..n image paths */
  images?: string[];
  /** Optional quick search / filter tags */
  tags?: string[];
  /** Optional extra hints visible to staff */
  notes?: string;
}

/**
 * Small helper — generate a stable html id for client-side anchors
 */
function toId(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
/**
 * Render the answer string with inline links.
 * Supports:
 *   1) Markdown link: [label](href)
 *   2) Link-by-label from qa.links: [[label]]
 */
function AnswerRich({ qa }: { qa: TroubleshootingQA }) {
  const text = qa.answer || "";
  // [[label]]  OR  [label](href)
  const rx = /(\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\))/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = rx.exec(text)) !== null) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));

    if (m[2]) {
      // [[label]] -> find in qa.links by label
      const label = m[2];
      const link = (qa.links || []).find((l) => l.label === label);
      if (link) {
        nodes.push(
          <Link
            key={`${label}-${m.index}`}
            href={link.href}
            className="underline"
          >
            {label}
          </Link>
        );
      } else {
        nodes.push(label);
      }
    } else if (m[3] && m[4]) {
      // [label](href)
      const label = m[3];
      const href = m[4];
      nodes.push(
        <Link
          key={`${label}-${href}-${m.index}`}
          href={href}
          className="underline"
        >
          {label}
        </Link>
      );
    }
    lastIndex = rx.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return <p className="mb-3 whitespace-pre-line">{nodes}</p>;
}

/**
 * Click-to-expand Q&A tile (visual parity with AdminTile)
 */
export function TroubleshootTile({
  qa,
  index,
}: {
  qa: TroubleshootingQA;
  index: number;
}) {
  const anchorId = useMemo(
    () => qa.section || toId(qa.question),
    [qa.section, qa.question]
  );

  // Build link list with backward-compat fallback
  const linkList = useMemo(() => {
    if (qa.links && qa.links.length > 0) return qa.links;
    if (qa.link)
      return [{ href: qa.link, label: "Go to page", section: qa.section }];
    return [] as { href: string; label: string; section?: string }[];
  }, [qa.links, qa.link, qa.section]);

  return (
    <details id={anchorId} className="group rounded-md border bg-card/50">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm
                   hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   [&::-webkit-details-marker]:hidden"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background/80 text-xs font-medium">
          {index}
        </span>
        <span className="flex-1">{qa.question}</span>
        <div className="hidden gap-1 md:flex">
          {qa.tags?.slice(0, 3).map((t) => (
            <Badge key={t} variant="outline" className="px-1 py-0 text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>

      <div className="px-3 pb-3 pt-0 text-sm text-muted-foreground">
        {/* Answer */}
        {/* Answer */}
        <AnswerRich qa={qa} />

        {/* Links / Related */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {linkList.map((l) => (
            <Link
              key={`${l.href}${l.section ?? ""}${l.label}`}
              href={l.section ? `${l.href}#${l.section}` : l.href}
              className="inline-flex items-center gap-1 text-xs text-foreground hover:underline"
            >
              <LinkIcon className="h-3 w-3" /> {l.label}
            </Link>
          ))}
        </div>

        {/* Images */}
        {qa.images && qa.images.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {qa.images.map((src) => (
              <div
                key={src}
                className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted"
              >
                <Image
                  src={src}
                  alt="Troubleshooting illustration"
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {qa.notes && (
          <div className="mt-3 rounded-md border bg-background/60 p-2 text-xs">
            <div className="mb-1 flex items-center gap-1 text-foreground">
              <Tag className="h-3 w-3" /> Staff note
            </div>
            <p className="leading-relaxed">{qa.notes}</p>
          </div>
        )}
      </div>
    </details>
  );
}

/**
 * Troubleshooting list with built-in filtering by page path and text search
 */
export function TroubleshootingDeck({
  items,
  filterByPath,
  defaultOpen = 0,
  enableSearch = true,
}: {
  items: TroubleshootingQA[];
  /**
   * Only show Q&As that include this path in their relatedPages
   * Example: "/documentation/software/gameSelection"
   */
  filterByPath?: string;
  /** If >0, automatically open the first tile (progressive disclosure still applies) */
  defaultOpen?: number;
  /** Show search box */
  enableSearch?: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const byPath = filterByPath
      ? items.filter((it) => it.relatedPages.includes(filterByPath))
      : items;

    if (!q) return byPath;
    const qq = q.toLowerCase();
    return byPath.filter((it) =>
      [
        it.question,
        it.answer,
        it.tags?.join(" ") || "",
        it.relatedPages.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, filterByPath, q]);

  return (
    <div className="space-y-2">
      {enableSearch && (
        <div className="mb-2">
          <input
            type="search"
            placeholder="Search troubleshooting…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          No matching Q&As yet.
        </div>
      ) : (
        filtered.map((qa, i) => (
          <TroubleshootTile key={qa.id} qa={qa} index={i + 1} />
        ))
      )}
    </div>
  );
}

/**
 * Section wrapper to match your document styling
 */
export function TroubleshootingSection({
  title = "Troubleshooting",
  items,
  filterByPath,
}: {
  title?: string;
  items: TroubleshootingQA[];
  filterByPath?: string;
}) {
    console.log(filterByPath);
  return (
    <section className="scroll-mt-24 rounded-xl border bg-card/50 p-5">
      <h2 className="mb-3 border-b pb-1 text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <TroubleshootingDeck items={items} filterByPath={filterByPath} />
    </section>
  );
}

export default function TroubleshootingAuto({ title = "Troubleshooting" }) {
  const items = useTroubleshootingForPath(); // auto-uses current pathname
  console.log("TroubleshootingAuto items:", items);
  return <TroubleshootingSection title={title} items={items} />;
}