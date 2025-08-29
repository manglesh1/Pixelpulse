// src/app/(protected)/documentation/hardware/page.tsx
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HardDrive,
  Monitor,
  Cable,
  Lock,
  Scan,
  RotateCcw,
  Speaker,
  Puzzle,
  TabletSmartphone,
  CreditCard,
  Axe,
} from "lucide-react";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" width={32} height={32} alt="Pixelpulse logo" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Hardware · Pixelpulse @ AeroSports
            </h1>
            <p className="text-sm text-muted-foreground">
              Physical devices used to run Pixelpulse games — what they do,
              where they connect, and how to check them safely.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Room PCs</Badge>
          <Badge variant="outline">Displays</Badge>
          <Badge variant="outline">I/O Devices</Badge>
          <Badge variant="outline">External Systems</Badge>
        </div>
      </header>

      {/* Sections grid */}
      <h2 className="text-lg font-semibold">Hardware Sections</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Pick a device to see connections, daily checks, and quick fixes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Room Touch PC */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Room Touch PC</CardTitle>
              <CardDescription>
                Runs Game Selection + Game Engine (1 per game room).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Power, network (Ethernet), USB devices, and kiosk mode checks.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/room-pc">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/room-pc"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Room Touch PC"
          />
        </Card>

        {/* Displays & Splitter */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Monitor className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Displays & Splitter</CardTitle>
              <CardDescription>
                Scorecard + Room Identifier via HDMI splitter (USB control).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cabling (HDMI/USB), monitor assignments, and swapping outputs.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/displays">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/displays"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Displays & Splitter"
          />
        </Card>

        {/* Door Lock (USB Relay, NO/NC) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Door Lock (USB Relay)</CardTitle>
              <CardDescription>NO/NC lock controlled from PC.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Relay status, wiring sanity checks, and manual override notes.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/door-lock">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/door-lock"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Door Lock"
          />
        </Card>

        {/* Wristband Scanner (USB / NFC) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Scan className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Wristband Scanner</CardTitle>
              <CardDescription>NFC scanner via USB.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reader detection, test scans, and cable/port swaps.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/wristband-scanner">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/wristband-scanner"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Wristband Scanner"
          />
        </Card>

        {/* Restart Button (USB) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Restart Button</CardTitle>
              <CardDescription>USB button to replay same game.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Input mapping, debouncing, and stuck-button symptoms.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/restart-button">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/restart-button"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Restart Button"
          />
        </Card>

        {/* Speakers (USB / 3.5mm) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Speaker className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Speakers</CardTitle>
              <CardDescription>USB or 3.5mm audio.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Output device selection, volume checks, and cable swaps.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/speakers">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/speakers"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Speakers"
          />
        </Card>

        {/* Game-specific Hardware (USB/Ethernet) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Puzzle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Game-specific Hardware</CardTitle>
              <CardDescription>USB or Ethernet devices per game.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sensors, lights, controllers—per-game wiring & indicators.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/game-devices">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/game-devices"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Game-specific Hardware"
          />
        </Card>

        {/* Registration Tablet (Android) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <TabletSmartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Registration Tablet</CardTitle>
              <CardDescription>
                New players + wristband linking (not on Room PC).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            App sign-in, Wi-Fi, and sync checks with Admin/POS.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/registration-tablet">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/registration-tablet"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Registration Tablet"
          />
        </Card>

        {/* POS PC */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">POS PC</CardTitle>
              <CardDescription>
                Initialize/activate wristbands, edit player info.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Login, wristband lifecycle, and basic connectivity.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/pos-pc">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/pos-pc"
            className="absolute inset-0 rounded-lg"
            aria-label="Open POS PC"
          />
        </Card>

        {/* Axe Throwing Setups (3 lanes) */}
        <Card className="group relative hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="rounded-md border p-2">
              <Axe className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Axe Throwing Setups</CardTitle>
              <CardDescription>PC, mirrored tablet UI, depth camera.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            3 lanes: pairing, mirroring, and sensor health checks.
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/documentation/hardware/axe-throwing">Open</Link>
            </Button>
          </CardFooter>
          <Link
            href="/documentation/hardware/axe-throwing"
            className="absolute inset-0 rounded-lg"
            aria-label="Open Axe Throwing Setups"
          />
        </Card>
      </div>

      <Separator className="my-6" />

      {/* What you'll learn */}
      <h2 className="text-lg font-semibold">What you’ll learn</h2>
      <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
        <li>How each device connects to the Room PC and what it controls.</li>
        <li>How to verify HDMI/USB/Ethernet connections and link lights.</li>
        <li>How to safely restart hardware without data loss.</li>
        <li>When to escalate to devs for recurring or cross-room issues.</li>
      </ul>

      <Separator className="my-6" />

      {/* Before you start */}
      <h2 className="text-lg font-semibold">Before you start</h2>
      <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
        <li>Confirm power to the Room PC and both monitors.</li>
        <li>
          Check Ethernet at the PC: link lights should blink (both RX/TX).
        </li>
        <li>
          Verify USB devices are detected (scanner, relay, restart button,
          splitter, speakers).
        </li>
        <li>
          If displays are swapped, use the Admin action “Swap Displays” (see
          Game Selection docs).
        </li>
        <li>Keep spare HDMI/USB/Ethernet cables and a known-good USB hub.</li>
      </ul>
    </>
  );
}
