import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
      grid min-h-screen
      grid-cols-1                         /* mobile: no sidebar column */
      md:grid-cols-[var(--sidebar-w,256px)_1fr]  /* md+: sidebar + main */
    "
    >
      <Sidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
