// src/app/(protected)/documentation/software/gameSelection/page.tsx
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gamepad2, Info } from "lucide-react";
import { Section,H2,LegendItem,H3, Marker, CornerMarker, OrderBadge, AdminTile, } from "@/components/docs/Helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Game Selection</h1>
            <p className="text-sm text-muted-foreground">
              Touchscreen used to select a game variant, see highscores, view players, and start/reset a session.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Interactive</Badge>
          <Badge variant="outline">Shared UI (content varies by game)</Badge>
        </div>
      </header>

      {/* SECTION: Screen at a glance */}
      <Section>
        <H2>Screen at a glance</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          The Game Selection screen is consistent across all games. Only the content (game name, variants, images) changes.
        </p>

        <div className="grid gap-4 xl:grid-cols-[20fr_7fr] 2xl:grid-cols-[2fr_1fr]">
          {/* Demo image with overlay labels (replace image when ready) */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Game Selection Screen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]">
                <Image
                  src="/docs/game-selection.png"
                  alt="Game Selection screen"
                  fill
                  className="object-cover opacity-90"
                  priority
                />
                <Marker n={1} x="3%"  y="10%"  />
                <Marker n={2} x="3%" y="55%"  />
                <Marker n={3} x="55%" y="7%"  />
                <Marker n={4} x="67%"  y="15%" />
                <Marker n={5} x="55%" y="27%" />
                <Marker n={6} x="63%" y="75%" />

              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend</CardTitle>
              <CardDescription>Numbered sections on the screen</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <LegendItem n={1} title="Game Variants">
                  Choose between <strong>Alliance</strong> (team play) and <strong>Competitive Circuit</strong> (players compete).
                  Selecting a variant updates the Description (2) and High Scores (3).
                </LegendItem>
                <LegendItem n={2} title="Variant Description">
                  Short rules & summary. Changes live when you switch variants.
                </LegendItem>
                <LegendItem n={3} title="High Scores">
                  Daily, Monthly, and All-time highs for the selected variant.
                </LegendItem>
                <LegendItem n={4} title="How to Play">
                  Button opens a dialog with instructions & tips. Include an illustration.
                </LegendItem>
                <LegendItem n={5} title="Players">
                  Up to 5 scanned players: name, personal best for this variant, time remaining, and reward level.
                </LegendItem>
                <LegendItem n={6} title="Controls">
                  <strong>Reset</strong> clears the player list. <strong>Start</strong> begins the game; disabled if no players or a game is already running.
                </LegendItem>
              </ol>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* SECTION: Detailed sections */}
      <Section>
        <H2>Detailed sections</H2>

        <H3>1) Game Variants</H3>
        <p className="text-sm text-muted-foreground">Variants are grouped by mode:</p>
        <ul className="mt-2 list-disc pl-6 text-sm">
          <li><strong>Alliance</strong> — everyone plays as a team. Score is combined or shared.</li>
          <li><strong>Competitive Circuit</strong> — each player competes individually.</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecting a variant updates the <em>Description</em> and <em>High Scores</em> panels in real time.
        </p>

        <H3>2) Variant Description</H3>
        <p className="text-sm text-muted-foreground">
          A short blurb that explains objective, win condition, round length, and tips. This content switches when a different variant is selected.
        </p>

        <H3>3) High Scores</H3>
        <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
          <li><strong>Daily</strong> — resets at local midnight.</li>
          <li><strong>Monthly</strong> — resets at the start of each month.</li>
          <li><strong>All-time</strong> — best scores across all time.</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          The high score panel always reflects the currently selected variant.
        </p>

        <H3>4) How to Play</H3>
        <p className="text-sm text-muted-foreground">
          Tapping the button opens a dialog with clear steps and visuals. Include safety notes if relevant.
        </p>

        {/* Shrink visual emphasis: small inline preview + Dialog for full image */}
        <div className="mt-3">
          <Dialog>
            <div className="flex items-center gap-3">
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="relative aspect-[4/3] w-48 lg:w-[22rem] xl:w-[28rem] overflow-hidden rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Open How to Play"
                >
                  <Image
                    src="/docs/how-to-play.png"
                    alt="How to Play preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 12rem, (max-width: 1280px) 22rem, 28rem"
                  />
                </button>
              </DialogTrigger>
            </div>

            <DialogContent className="p-0 sm:max-w-[90vw] lg:max-w-[1000px]">
              <DialogHeader className="px-4 pt-4">
                <DialogTitle>How to Play</DialogTitle>
              </DialogHeader>

              <div className="relative mx-4 mb-4 h-[30vh] md:h-[50vh] lg:h-[70vh]">
                <Image
                  src="/docs/how-to-play.png"
                  alt="How to Play (full)"
                  fill
                  className="object-contain bg-muted rounded-md"
                  priority
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <H3>5) Players</H3>
        <p className="text-sm text-muted-foreground">
          Shows up to 5 players who have scanned for this game. Each row displays:
        </p>
        <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
          <li><strong>Name</strong></li>
          <li><strong>High score (variant)</strong> — player’s personal best for the selected variant</li>
          <li><strong>Time remaining</strong> — minutes/seconds on their wristband/session</li>
          <li><strong>Reward level</strong> — e.g., bronze/silver/gold or numeric tier</li>
        </ul>

        <H3>6) Controls</H3>
        <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
          <li><strong>Reset</strong> — clears the player list (section 5). Use if the wrong players were scanned or to prep the next group.</li>
          <li><strong>Start</strong> — begins the session for the selected variant. Disabled when there are no players scanned or a game is already running.</li>
        </ul>

        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4" />
          <p>
            Button availability depends on the game state and player list. If you see a disabled <em>Start</em> with players present, check that the previous session has fully ended.
          </p>
        </div>
      </Section>

      {/* Tips – Secret Admin Panel */}
      <Section>
        <H2>Tips: Secret Admin Panel</H2>
        <p className="mb-4 text-sm text-muted-foreground">
          To open the hidden Admin panel, tap the screen corners in this exact order:
          <span className="ml-1 font-medium">1 → 4 → 2 → 3</span>.
        </p>

        <div className="grid gap-4 xl:grid-cols-3">
          {/* A) Corner-press order (labeled image) */}
          <Card className="relative overflow-hidden xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Corner Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]">
                <Image src="/docs/game-selection.png" alt="Admin corner pattern" fill className="object-cover opacity-90" />

                {/* Corner markers in press order: 1(top-left) → 4(bottom-right) → 2(top-right) → 3(bottom-left) */}
                <CornerMarker n={1} pos="tl" />
                <CornerMarker n={4} pos="br" />
                <CornerMarker n={2} pos="tr" />
                <CornerMarker n={3} pos="bl" />

                {/* Order chips */}
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs shadow-sm">
                  <OrderBadge>1</OrderBadge>
                  <span>→</span>
                  <OrderBadge>4</OrderBadge>
                  <span>→</span>
                  <OrderBadge>2</OrderBadge>
                  <span>→</span>
                  <OrderBadge>3</OrderBadge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B) Password dialog (placeholder) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Password Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-card p-4">
                {/* Optional image alternative */}
                <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-md border">
                  <Image src="/docs/admin-password.png" alt="Admin dialog" fill className="object-contain bg-muted" />
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  The default password is <code className="rounded bg-muted px-1">Admin</code> (change it in production).
                </p>

                {/* Mock dialog UI (non-functional) */}
                {/* <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground">Enter Admin Password</label>
                    <Input type="password" value="admin" readOnly className="mt-1" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Default is <code className="rounded bg-muted px-1">admin</code> until changed.
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">Cancel</Button>
                    <Button size="sm">OK</Button>
                  </div>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* C) Admin Panel options */}
        <div className="mt-6">
          {/* Quick grid (8 buttons) */}
          {/* C) Admin Panel — Actions & Guidance (single column) */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Admin Panel — Actions & Guidance</CardTitle>
              <CardDescription>Tap a tile to see when to use it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AdminTile n={1} label="Restart App">
                  Restarts <em>Game Selection</em> only. Use if the UI freezes or a connected device
                  (scanner, door lock, monitors, reset button) stops responding.
                </AdminTile>

                <AdminTile n={2} label="Restart PC">
                  Full system reboot. Use if restarting the app didn’t resolve the issue.
                </AdminTile>

                <AdminTile n={3} label="Stop Game">
                  Stops the Game Engine (current session). Use if a game is running without players,
                  to unlock the door, or if the game has frozen/misbehaves.
                </AdminTile>

                <AdminTile n={4} label="Simulate Scan">
                  Adds a master test player to the Players list. Use for testing or when a customer
                  wristband won’t scan.
                </AdminTile>

                <AdminTile n={5} label="Log Out of PC">
                  Signs out of Windows user. <strong>Avoid for general staff</strong>; use only if instructed.
                </AdminTile>

                <AdminTile n={6} label="Update">
                  Updates Game Selection & Game Engine to the latest stable. <strong>Press only after</strong>
                  consulting managers/devs.
                </AdminTile>

                <AdminTile n={7} label="Swap Displays">
                  Swaps which monitor shows the Scorecard vs. the Display. Use if they appear on the wrong screens.
                </AdminTile>

                <AdminTile n={8} label="Close Game Selection">
                  Exits kiosk mode. Use when changing PC settings (sound, network) or reviewing logs.
                </AdminTile>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section last>
        <H2>Troubleshooting</H2>
        <p className="text-sm text-muted-foreground">We’ll add troubleshooting steps here.</p>
      </Section>
    </>
  );
}


