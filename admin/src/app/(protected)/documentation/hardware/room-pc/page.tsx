import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Section,
  H2,
  H3,
  LegendItem,
  Marker,
  AdminTile,
} from "@/components/docs/Helpers";
import {
  MonitorSmartphone,
  Touchpad,
  Cable,
  Power,
  Info,
  PlugZap,
  ShieldCheck,
  Wrench,
  Network,
  Usb,
  Monitor,
  Speaker,
  Lock,
  Scan,
  RotateCcw,
} from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

const roomPcLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "50%", left: "50%" },
    title: "Touchscreen",
    description: "Main interaction point for Game Selection.",
  },
  {
    n: 2,
    position: { top: "20%", left: "90%" },
    title: "Power Button (typical side)",
    description:
      "Used if auto-power fails in the morning (see Power & Startup).",
  },
  {
    n: 3,
    position: { top: "85%", left: "10%" },
    title: "USB Ports / Hub",
    description:
      "NFC scanner, USB relay (door lock), restart button, splitter control, speakers (USB), game-specific USB devices.",
  },
];

const connectionLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "20%", left: "20%" },
    title: "USB",
    description:
      "Wristband scanner, USB relay (door lock), restart button, audio (USB speakers), game-specific devices, HDMI splitter control (if applicable).",
  },
  {
    n: 2,
    position: { top: "40%", left: "80%" },
    title: "Ethernet",
    description:
      "Game Engine ↔ devices (where applicable), network services; RX/TX lights should blink.",
  },
  {
    n: 3,
    position: { top: "60%", left: "50%" },
    title: "HDMI",
    description: "To splitter → Room Identifier & Scorecard monitors.",
  },
  {
    n: 4,
    position: { top: "70%", left: "30%" },
    title: "Audio",
    description: "USB or 3.5mm speakers.",
  },
  {
    n: 5,
    position: { top: "75%", left: "60%" },
    title: "Door lock",
    description: "NO/NC via USB relay.",
  },
  {
    n: 6,
    position: { top: "85%", left: "40%" },
    title: "NFC Handscanner",
    description: "USB connection for wristband scanning.",
  },
  {
    n: 7,
    position: { top: "90%", left: "70%" },
    title: "Restart Button",
    description: "USB connection to replay same game without Game Selection.",
  },
];

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <Monitor className="h-[48px] w-[48px]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Room Touch PC
            </h1>
            <p className="text-sm text-muted-foreground">
              All-in-one <strong>touchscreen</strong> PC mounted at each game
              room. Runs
              <strong> Game Selection</strong> and the{" "}
              <strong>Game Engine</strong>, and connects to all room devices.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Touchscreen</Badge>
          <Badge variant="outline">USB</Badge>
          <Badge variant="outline">Ethernet</Badge>
          <Badge variant="outline">HDMI (via splitter)</Badge>
        </div>
      </header>

      {/* Screen at a glance (PC overview) */}
      <Section>
        <H2>PC at a glance</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          One PC per room. Users interact directly with its <strong>touchscreen</strong> for
          Game Selection. All game I/O devices plug into this PC.
        </p>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 ">
          {/* Overview image with markers */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Room Touch PC</CardTitle>
              <CardDescription>
                Front view — interaction & ports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/hardware/room-pc/pc.png"
                  alt="Room Touch PC (front)"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </CardContent>
          </Card>
          {/* Positioning mock */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Positioning</CardTitle>
              <CardDescription>
                Relative to the game room entrance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/hardware/room-pc/positioning.png"
                  alt="PC Positioning relative to room"
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Placement & Connections */}
      <Section>
        <H2>Placement & Connections</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          The PC is mounted <strong>just outside</strong> the room entrance so <strong>Room Identifier</strong> and <strong>Scorecard</strong>.
        </p>

        <ImageWithLabel
          title="Connections"
          image="/docs/hardware/room-pc/connections.png"
          alt="Connections diagram"
          labels={connectionLabels}
        />
      </Section>

      {/* Power & Startup (Tip 1, Tip 2, Tip 3) */}
      <Section>
        <H2>Power & Startup</H2>

        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Power className="mr-2 inline h-4 w-4" />
              Tip 1 — Proper Shutdown before Main Switch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Always</strong> shut down the PC before cutting power at the main
              switch. From Game Selection, open the{" "}
              <Link
                href="/documentation/software/gameSelection#tips-secret-admin-panel"
                className="underline"
              >
                Secret Admin Panel
              </Link>{" "}
              and press <strong>“Close Game Selection”</strong> to exit kiosk
              mode. Then use Windows to <strong>Shut down</strong> the PC. (PCs are
              configured to auto-power on when power is restored.)
            </p>
          </CardContent>
        </Card>

        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <PlugZap className="mr-2 inline h-4 w-4" />
              Tip 2 — Morning Auto-Start / Account Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              In the morning, the PC should <strong>auto-power on</strong>. If it doesn’t:
              open the access panel, confirm the power cable is seated, and
              press the <strong>power button</strong> (usually on the side).
            </p>
            <p>
              If the PC stops at <strong>account selection</strong>, choose{" "}
              <strong>GameUser</strong> (not Admin). It will automatically enter
              kiosk mode and start <strong>Game Selection</strong>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <MonitorSmartphone className="mr-2 inline h-4 w-4" />
              Tip 3 — If Game Selection doesn’t auto-open
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5">
              <li>
                Click the <strong>folder</strong> icon on the taskbar to open File Explorer.
              </li>
              <li>
                Go to <code>C:\</code> → <code>deploy</code> and run{" "}
                <code>watch_dog.bat</code>.
              </li>
              <li>
                If that doesn’t start it: go to{" "}
                <code>C:\Pixelpulse\GameSelection</code> and open{" "}
                <code>gameSelection.exe</code>.
              </li>
            </ol>
          </CardContent>
        </Card>
      </Section>

      {/* Daily Checks */}
      <Section>
        <H2>Daily Checks</H2>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Before opening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>PC powered on and in <strong>Game Selection</strong>.</li>
                <li>
                  Both room monitors show <strong>Identifier</strong> and <strong>Scorecard</strong>.
                </li>
                <li>Ethernet link lights are <strong>blinking</strong> (RX/TX).</li>
                <li>NFC scanner registers a test scan.</li>
                <li>
                  Door lock responds (test from an idle/authorized state).
                </li>
                <li>Speakers output sound test.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cabling sanity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>USB hub firmly seated; no loose connectors.</li>
                <li>HDMI firmly connected to splitter; splitter powered.</li>
                <li>3.5mm/USB speakers selected as output device.</li>
                <li>Game-specific devices connected and reporting OK.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Troubleshooting (quick tiles on this page) */}
      <Section last>
              <H2>Troubleshooting</H2>
              <TroubleshootingAuto />
            </Section>
    </>
  );
}
