import type { ReactNode } from "react";
import TocPanel from "@/components/docs/TocPanel";
import BottomBreadcrumb from "@/components/docs/BottomBreadcrumb";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid xl:grid-cols-[1fr_280px] gap-6 px-4">
      <main id="content" className="min-h-screen pt-20 pb-20">
        {children}
      </main>

      <aside className="sticky pt-14 top-4 h-[calc(100vh-1rem)] hidden xl:block">
        <div className="rounded-lg border bg-background p-3">
          <TocPanel /> {/* no topics prop; it will fetch based on URL */}
        </div>
      </aside>

      <BottomBreadcrumb className="fixed top-0 left-0 right-0 md:left-[var(--sidebar-w)] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 transition-[left] duration-200" />
    </div>
  );
}
