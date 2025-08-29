"use client";

import React, { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { TroubleshootingQA } from "./Troubleshooting";
import { troubleshootingData } from "../lib/docs/data";

const TroubleshootingContext = createContext<TroubleshootingQA[]>([]);

export function TroubleshootingProvider({
  children,
  value = troubleshootingData,
}: {
  children: React.ReactNode;
  value?: TroubleshootingQA[];
}) {
  return (
    <TroubleshootingContext.Provider value={value}>
      {children}
    </TroubleshootingContext.Provider>
  );
}

export function useTroubleshooting() {
  return useContext(TroubleshootingContext);
}

export function useTroubleshootingForPath(path?: string) {
  const data = useTroubleshooting();
  const pathname = usePathname();
  const key = path ?? pathname;
  return useMemo(
    () => (key ? data.filter((it) => it.relatedPages.includes(key)) : data),
    [data, key]
  );
}
