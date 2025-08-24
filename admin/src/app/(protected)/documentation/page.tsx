// src/app/(protected)/documentation/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HardDrive, Gamepad2, BookOpenCheck, Zap, Shield, BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" width={32} height={32} alt="Pixelpulse logo" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Pixelpulse Documentation</h1>
            <p className="text-sm text-muted-foreground">
              AeroSports facility · Guides for non-technical staff
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Getting Started</Badge>
          <Badge variant="outline">How-tos</Badge>
          <Badge variant="outline">Troubleshooting</Badge>
        </div>
      </header>

      {/* Sections */}
      <h2 className="text-lg font-semibold">Sections</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Choose a section to dive into setup, daily operations, and fixes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Hardware */}
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Hardware</CardTitle>
              <CardDescription>
                Devices, wiring, sensors, controllers, smart switches, and displays.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Power-on checklists, LED/switch control notes, Pi leaderboard display, and typical faults.
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Safe handling & resets</span>
            </div>
            <Button asChild>
              <Link href="/documentation/hardware">Open hardware</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware"
            className="absolute inset-0 rounded-lg"
            aria-label="Open hardware documentation"
          />
        </Card>

        {/* Software */}
        <Card className="group hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Software</CardTitle>
              <CardDescription>
                Game Selection, Game Engine, Registration, POS, Admin Panel, Axe Throw.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Launching games, scorecards, customer registration, wristbands, analytics, and controls.
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Daily operations & tips</span>
            </div>
            <Button asChild>
              <Link href="/documentation/software">Open software</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/software"
            className="absolute inset-0 rounded-lg"
            aria-label="Open software documentation"
          />
        </Card>
      </div>

      <Separator className="my-6" />

      {/* What you'll find (helps the ToC) */}
      <h2 className="text-lg font-semibold">What you’ll find here</h2>
      <div className="mt-2 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpenCheck className="h-4 w-4" />
              Quick Guides
            </div>
            <CardTitle className="text-base">Step-by-step tasks</CardTitle>
            <CardDescription>Short, reliable instructions for the most common tasks.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Troubleshooting
            </div>
            <CardTitle className="text-base">Fix it fast</CardTitle>
            <CardDescription>What to check, typical errors, and safe recovery steps.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Safety
            </div>
            <CardTitle className="text-base">Do no harm</CardTitle>
            <CardDescription>Power, cables, moving parts, and permissions best practices.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Tips (also gives ToC some anchors) */}
      <h2 className="text-lg font-semibold">Tips for Staff</h2>
      <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
        <li>Use the sidebar to jump between sections; it updates automatically.</li>
        <li>For issues, check the troubleshooting section in each area first.</li>
        <li>If hardware affects software (or vice-versa), look at both pages.</li>
      </ul>
    </>
  );
}
