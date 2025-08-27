// lib/docsIndex.ts
import fs from "fs";
import path from "path";

const DOCS_ROUTE = "documentation";
const DOCS_ROUTE_DIR = path.join(process.cwd(), "src", "app", "(protected)", DOCS_ROUTE);

const PAGE_FILES = ["page.tsx", "page.mdx", "page.md"];

const hasPage = (dirAbs: string) => PAGE_FILES.some((f) => fs.existsSync(path.join(dirAbs, f)));

const humanize = (seg: string) =>
  seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const shouldSkipDir = (name: string) =>
  name.startsWith("(") || name.startsWith("_") || name === "components" || name === "api";

export const getChildTopics = (segments: string[] = []) => {
  const parentAbs = path.join(DOCS_ROUTE_DIR, ...segments);
  if (!fs.existsSync(parentAbs)) return [];

  const entries = fs.readdirSync(parentAbs, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory() && !shouldSkipDir(e.name));

  return dirs
    .filter((d) => hasPage(path.join(parentAbs, d.name)))
    .map((d) => ({
      label: humanize(d.name),
      href: "/" + [DOCS_ROUTE, ...segments, d.name].join("/"),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
