"use client";

import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Section,
  H2,
  H3,
  LegendItem,
  Marker,
  AdminTile,
} from "@/components/docs/Helpers";
import { ProcessSteps } from "@/components/docs/Process";
import {
  QrCode,
  Wifi,
  Timer,
  ShieldCheck,
  ScanLine,
  HelpCircle,
  MonitorPlay,
  Network as NetworkIcon,
} from "lucide-react";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <Image
              src=""
              alt="Axe Kiosk Icon"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Axe Throwing Kiosk — Axcitement PC Wrapper
            </h1>
            <p className="text-sm text-muted-foreground">
              NFC wristband → validate → pick duration → launch Axcitement PC
              via VNC → auto end &amp; return.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <QrCode className="mr-1 h-3.5 w-3.5" /> NFC Required
              </Badge>
              <Badge variant="outline">
                <Wifi className="mr-1 h-3.5 w-3.5" /> Internet Required
              </Badge>
              <Badge variant="outline">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Kiosk Mode
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Overview at a glance */}
      <Section>
        <H2>Screen at a glance</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          The kiosk is a locked Android tablet that scans NFC, checks validity
          of wristbands via API, offers time choices, then launches the
          Axcitement PC app through bVNC with a bottom-overlay countdown.
        </p>

        <div className="grid gap-4 xl:grid-cols-[20fr_7fr] 2xl:grid-cols-[2fr_1fr]">
          {/* Overview image with markers */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kiosk UI Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]">
                <Image
                  src="/docs/axe/axe-overview.png" // drop a screenshot/mock here
                  alt="Axe Kiosk Overview"
                  fill
                  className="object-contain"
                  priority
                />
                {/* Markers aligned to your XAML */}
                <Marker n={1} x="50%" y="11%" />{" "}
                {/* TimeLabel (tap 5x admin) */}
                <Marker n={3} x="50%" y="55%" /> {/* StatusLabel */}
                <Marker n={5} x="94%" y="6%" /> {/* Help button */}
                <Marker n={6} x="88%" y="6%" /> {/* Network status icon */}
                {/* Popups (modal positions are conceptual) */}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend</CardTitle>
              <CardDescription>Numbered areas on the screen</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <LegendItem n={1} title="TimeLabel (Admin Exit)">
                  Tap 5× within 3s to prompt Admin PIN (<code>Admin</code>) and
                  exit kiosk to settings.
                </LegendItem>
                <LegendItem n={3} title="StatusLabel">
                  Idle: “Please Scan Your Wristband” → validation messages,
                  prompts.
                </LegendItem>
                <LegendItem n={5} title="Help">
                  Opens modal with “How to scan” visuals.
                </LegendItem>
                <LegendItem n={6} title="Network">
                  Green/OK or Error badge. Internet required for validation &
                  sessions.
                </LegendItem>
              </ol>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Process */}
      <Section>
        <H2>Flow</H2>
        <p className="text-sm text-muted-foreground pb-4">
          The kiosk validates via API, gates duration on remaining time,
          launches bVNC into Axcitement PC, and shows an overlay countdown that
          auto-returns on completion.
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          <ProcessSteps
            title="Axe Kiosk Process"
            description="Scan → Validate → Pick Duration → Launch VNC → Session Overlay → Auto Return"
            steps={[
              {
                title: "Step 1 — Scan wristband",
                img: "/docs/axe/axe-process-1.png",
                caption:
                  "Hold wristband to the NFC area until the tablet beeps or UI changes.",
                detail:
                  "The app listens for UID and switches to validating state (spinner + 'Validating…').",
              },
              {
                title: "Step 2 — Server validation",
                img: "/docs/axe/axe-process-2.png",
                caption:
                  "API call to validate band and compute remaining time.",
                detail:
                  "Handles: Not registered → prompt to register; Not valid/expired → front desk; Active session but out-of-window → 'Session not active'; Valid + in-window → open Duration popup.",
              },
              {
                title: "Step 3 — Pick duration",
                img: "/docs/axe/axe-process-3.png",
                caption:
                  "15/30/45/60 (enabled based on remaining time) or Use Remaining Time.",
                detail:
                  "Button availability reflects _remainingMinutes. Selecting a duration begins session setup and launches VNC.",
              },
              {
                title: "Step 4 — Launch Axcitement (bVNC)",
                img: "/docs/axe/axe-process-4.png",
                caption:
                  "bVNC starts & auto taps; bottom input-blocker overlay appears.",
                detail:
                  "The kiosk performs scripted taps and shows a bottom overlay with a live countdown and a Quit button (sends a broadcast to end).",
              },
              {
                title: "Step 5 — Auto end & return",
                img: "/docs/axe/axe-process-5.png",
                caption:
                  "When time elapses or Quit pressed, kiosk returns to scan screen.",
                detail:
                  "Overlay is removed, VNC closed/foregrounded away, and Status resets to 'Please Scan Your Wristband'.",
              },
            ]}
            note="Admin exit: tap the time label 5× quickly (3s window), enter PIN 'Admin' to leave kiosk and open settings."
          />

          {/* Behavior / Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Key Behavior</CardTitle>
              <CardDescription>Grounded in the app code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AdminTile n={1} label="Internet gating">
                Validation uses the API. If offline, user-friendly messages
                appear (e.g., “Please wait a few minutes for the tablet to
                connect…”).
              </AdminTile>
              <AdminTile n={2} label="Duration gating">
                15/30/45/60 are enabled if remaining time ≥ option. Shows “Use
                Remaining Time” if &lt; 15m &gt; 0.
              </AdminTile>
              <AdminTile n={3} label="VNC overlay">
                Accessibility overlay blocks bottom UI, shows countdown, and
                exposes a <em>Quit</em> action.
              </AdminTile>
              <AdminTile n={4} label="Admin unlock">
                Tap time label 5× within 3s → PIN prompt → exits kiosk and opens
                Settings (Android).
              </AdminTile>
              <AdminTile n={5} label="Kiosk hardening">
                Status bar/keyguard disabled, lock-task mode,
                volume/home/power/back suppressed.
              </AdminTile>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">System Requirements</CardTitle>
              <CardDescription>What this deployment expects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  Android tablet with NFC &amp; AccessibilityService enabled for
                  overlay/gestures.
                </li>
                <li>
                  bVNC installed: <code>com.iiordanov.freebVNC</code> with
                  launcher activity.
                </li>
                <li>
                  Internet access for the validation API (base URL configured in
                  app settings).
                </li>
                <li>
                  Device Owner / Lock Task Mode whitelisting for kiosk + bVNC
                  packages.
                </li>
              </ul>
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                <NetworkIcon className="mt-0.5 h-4 w-4" />
                <p>
                  The network badge reflects connectivity; many flows are
                  blocked while offline.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Axcitement Notes */}
      <Section>
        <H2>Axcitement PC Notes</H2>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What’s inside VNC</CardTitle>
              <CardDescription>
                Axcitement software on the lane PC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  The kiosk simply launches the PC-side app and hands control to
                  the guest.
                </li>
                <li>Automated taps can be adjusted per-PC layout if needed.</li>
                <li>
                  The bottom overlay prevents accidental Android nav and keeps a
                  visible timer.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Troubleshooting</CardTitle>
              <CardDescription>Common kiosk issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AdminTile n={1} label="No Internet">
                You’ll see friendly “Please wait for the tablet to connect…”
                style messages. Check Ethernet connection and open settings by
                tapping time 5 times and enterring admin pin.
              </AdminTile>
              <AdminTile n={2} label="Not Registered / Not Valid">
                Direct guest to the registration station or front desk. The
                kiosk won’t start a session.
              </AdminTile>
              <AdminTile n={3} label="Stuck in VNC">
                Tap <em>Quit</em> on the overlay, or let the timer elapse. Admin
                can force-exit via PIN or by restarting the tablet.
              </AdminTile>
              <AdminTile n={4} label="NFC not responding">
                Ensure NFC is enabled and foreground dispatch is active. Try
                rescanning flat on the zone. If issue persists, restart tablet
                or contact for support.
              </AdminTile>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  );
}
