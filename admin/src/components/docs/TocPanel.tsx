// src/app/(protected)/documentation/components/TocPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

type Heading = { id: string; text: string; level: number };
type Topic = { label: string; href: string };

const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export default function TocPanel() {
  const pathname = usePathname();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch child topics for the current docs path
  useEffect(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    const i = parts.indexOf("documentation");
    const segs = i >= 0 ? parts.slice(i + 1) : [];
    const p = encodeURIComponent(segs.join("/"));
    fetch(`/documentation/children?p=${p}`)
      .then((r) => r.json())
      .then((d) => setTopics(d?.topics ?? []))
      .catch(() => setTopics([]));
  }, [pathname]);

  // Build on-page headings (h1–h3 or custom [data-toc])
  useEffect(() => {
    const root = document.getElementById("content");
    if (!root) return;

    const SELECTOR = "h1, h2, h3, [data-toc]";
    const els = Array.from(root.querySelectorAll(SELECTOR));

    const mapped: Heading[] = els.map((el) => {
      let level: number;
      if (el.matches("[data-toc]")) {
        const lv =
          Number((el as HTMLElement).dataset.tocLevel) ||
          Number(el.getAttribute("aria-level")) ||
          2;
        level = Math.min(Math.max(lv, 1), 6);
      } else {
        level = el.tagName === "H1" ? 1 : el.tagName === "H2" ? 2 : 3;
      }

      const text =
        (el as HTMLElement).dataset.tocTitle || (el.textContent || "").trim();
      if (!(el as HTMLElement).id) {
        const base = slugify(text || "section");
        let cand = base,
          i = 2;
        while (document.getElementById(cand)) cand = `${base}-${i++}`;
        (el as HTMLElement).id = cand;
      }
      return { id: (el as HTMLElement).id, text, level };
    });

    setHeadings(mapped);

    // Highlight current section
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("id");
          if (entry.isIntersecting && id) {
            setActiveId(id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const indent = (level: number) =>
    level <= 1 ? "pl-0" : level === 2 ? "pl-4" : "pl-8";

  return (
    <ScrollArea className="max-h-[calc(100vh-6rem)] pr-2">
      {/* Topics (child pages) */}
      {topics.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Topics
          </p>
          <ul className="space-y-1 text-sm">
            {topics.map((t) => (
              <li key={t.href}>
                <a
                  href={t.href}
                  className="block rounded px-1 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* On this page */}
      {headings.length > 0 && (
        <>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </p>
          <nav aria-label="Table of contents">
            <ul className="space-y-1 text-sm">
              {headings.map((h) => (
                <li key={h.id} className={indent(h.level)}>
                  <a
                    href={`#${h.id}`}
                    className={[
                      "block rounded px-1 py-0.5 transition-colors",
                      activeId === h.id
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </ScrollArea>
  );
}
