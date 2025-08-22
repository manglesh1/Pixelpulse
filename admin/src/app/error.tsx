"use client";

import * as React from "react";
import { ErrorPage } from "@/components/lib/error-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {}, [error]);

  return (
    <ErrorPage
      title="Something went wrong"
      description="An unexpected error occurred. You can try again or return home."
      actions={[
        { label: "Try again", onClick: () => reset() },
        { label: "Go Home", href: "/", variant: "outline" },
      ]}
    />
  );
}
