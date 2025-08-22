"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "ghost"
    | "link";
};

export function ErrorPage({
  code,
  title,
  description,
  actions = [],
}: {
  code?: string | number;
  title: string;
  description?: string;
  actions?: Action[];
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          {code ? (
            <div className="text-muted-foreground text-sm tracking-widest">
              {code}
            </div>
          ) : null}
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {actions.map((a, i) =>
                a.href ? (
                  <Button asChild key={i} variant={a.variant ?? "default"}>
                    <Link href={a.href}>{a.label}</Link>
                  </Button>
                ) : (
                  <Button
                    key={i}
                    onClick={a.onClick}
                    variant={a.variant ?? "default"}
                  >
                    {a.label}
                  </Button>
                )
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
