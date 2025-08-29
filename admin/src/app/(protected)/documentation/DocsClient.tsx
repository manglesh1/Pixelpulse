"use client";

import { TroubleshootingProvider } from "@/components/docs/TrobleshootingContext";


export default function DocsClient({ children }: { children: React.ReactNode }) {
  return <TroubleshootingProvider>{children}</TroubleshootingProvider>;
}
