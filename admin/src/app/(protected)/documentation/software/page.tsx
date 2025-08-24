// src/app/(protected)/documentation/software/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Gamepad2, Cpu, ShoppingCart, UserPlus, Target } from "lucide-react";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" width={32} height={32} alt="Pixelpulse logo" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Software · Pixelpulse @ AeroSports</h1>
            <p className="text-sm text-muted-foreground">
              Guides for non-technical staff to run, monitor, and troubleshoot Pixelpulse software.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Game Launch</Badge>
          <Badge variant="outline">Wristbands</Badge>
          <Badge variant="outline">Troubleshooting</Badge>
        </div>
      </header>

      {/* Sections grid */}
      <h2 className="text-lg font-semibold">Software Sections</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Pick a section to see setup, day-to-day tasks, and quick fixes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Game Selection */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Game Selection</CardTitle>
              <CardDescription>Launch games, show scorecards, room name displays.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Start/stop games, pick variants, verify screens for up to 8 rooms.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild><Link href="/documentation/software/gameSelection">Open</Link></Button>
          </CardFooter>
          <Link href="/documentation/software/gameSelection" className="absolute inset-0 rounded-lg" aria-label="Open Game Selection" />
        </Card>

        {/* Game Engine */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Game Engine</CardTitle>
              <CardDescription>Real-time link between software and game hardware.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Service health, device connectivity, and common error states.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild><Link href="/documentation/software/game-engine">Open</Link></Button>
          </CardFooter>
          <Link href="/documentation/software/game-engine" className="absolute inset-0 rounded-lg" aria-label="Open Game Engine" />
        </Card>

        {/* POS */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">POS</CardTitle>
              <CardDescription>Initialize & renew wristbands, edit customer info.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Connect customers ↔ wristbands, renewals, and quick edits.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild><Link href="/documentation/software/pos">Open</Link></Button>
          </CardFooter>
          <Link href="/documentation/software/pos" className="absolute inset-0 rounded-lg" aria-label="Open POS" />
        </Card>

        {/* Registration */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Registration (Android)</CardTitle>
              <CardDescription>Collect name, email, and wristband before play.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Kiosk setup, customer flow, and syncing with POS/Admin.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild><Link href="/documentation/software/registration">Open</Link></Button>
          </CardFooter>
          <Link href="/documentation/software/registration" className="absolute inset-0 rounded-lg" aria-label="Open Registration" />
        </Card>

        {/* Axe Throwing */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Axe Throwing</CardTitle>
              <CardDescription>Android wrapper to control the axe PC.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Pairing, mirroring, and tablet controls for game sessions.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild><Link href="/documentation/software/axe-throwing">Open</Link></Button>
          </CardFooter>
          <Link href="/documentation/software/axe-throwing" className="absolute inset-0 rounded-lg" aria-label="Open Axe Throwing" />
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Extras so the ToC has anchors */}
      <h2 className="text-lg font-semibold">What you’ll learn</h2>
      <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
        <li>How to launch, pause, and end games safely.</li>
        <li>How the Game Engine communicates with sensors, lights, and controllers.</li>
        <li>How to register customers and manage wristbands using POS & Registration.</li>
        <li>How to operate the Axe Throwing tablet experience.</li>
      </ul>

      <Separator className="my-6" />

      <h2 className="text-lg font-semibold">Before you start</h2>
      <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
        <li>Confirm network availability and device power for the target room(s).</li>
        <li>Ensure your staff account has proper permissions in the Admin Panel.</li>
        <li>Have spare wristbands ready at POS in case of swaps or renewals.</li>
      </ul>
    </>
  );
}
