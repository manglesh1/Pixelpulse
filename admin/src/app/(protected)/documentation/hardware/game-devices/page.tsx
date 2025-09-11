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
import { Section, H2 } from "@/components/docs/Helpers";
import {
  Network,
  Cable,
  Wrench,
  ShieldCheck,
  ServerCog,
  PlugZap,
  Zap,
  Activity,
} from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

/**
 * Controllers (USR-N510) — label map
 */
const controllerLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "18%", left: "25%" },
    title: "RS422 DIP Switch",
    description:
      "Set for RS422: first switch UP, second switch DOWN. Do not change other modes.",
  },
  {
    n: 2,
    position: { top: "55%", left: "20%" },
    title: "Channel Connectors (x4 or x1)",
    description:
      "Each channel is one section. Terminals (left→right): T+, T−, R+, R−, GND.",
  },
  {
    n: 3,
    position: { top: "30%", left: "75%" },
    title: "Ethernet Port",
    description:
      "Connects directly to Room PC or switch. Link/Activity LEDs should blink when active.",
  },
  {
    n: 4,
    position: { top: "75%", left: "35%" },
    title: "Channel Status LEDs",
    description:
      "Show activity per section. If dark: section unpowered or wiring issue.",
  },
  {
    n: 5,
    position: { top: "85%", left: "70%" },
    title: "Power In",
    description: "Low-voltage input for the controller (as per your unit).",
  },
];

/**
 * SMPS variants — label map
 */
const smpsLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "25%", left: "30%" },
    title: "24V 400W SMPS (fan type)",
    description:
      "AC in; DC out. Observe polarity: + to +, − to −. We use a single DC output tap.",
  },
  {
    n: 2,
    position: { top: "25%", left: "70%" },
    title: "24V 400W SMPS (block type)",
    description:
      "Two DC output leads. Cover unused outputs. Same polarity rules apply.",
  },
  {
    n: 3,
    position: { top: "78%", left: "30%" },
    title: "AC Input",
    description: "Mains input to SMPS. Only trained staff should service.",
  },
  {
    n: 4,
    position: { top: "78%", left: "70%" },
    title: "DC Output",
    description: "Feeds T-connectors/sensors. Verify polarity before powering.",
  },
];

/**
 * Light sensors — label map
 */
const sensorsLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "22%", left: "22%" },
    title: "Sensor Module (male/female)",
    description:
      "Each sensor has male & female ends to daisy-chain within a section.",
  },
  {
    n: 2,
    position: { top: "55%", left: "20%" },
    title: "6-pin Cable",
    description:
      "All 6 wires pass through extensions. At the controller, ignore Yellow; connect T+, T−, R+, R−, GND in order.",
  },
  {
    n: 3,
    position: { top: "35%", left: "70%" },
    title: "T-Connector (power inject)",
    description:
      "Injects 24V from SMPS into the section. Place mid-chain for even power and easy access.",
  },
  {
    n: 4,
    position: { top: "80%", left: "65%" },
    title: "Section Daisy Chain",
    description: "All sensors in a section are chained end-to-end.",
  },
];

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <ServerCog className="h-[48px] w-[48px]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Game Devices</h1>
            <p className="text-sm text-muted-foreground">
              Common devices used across rooms: Controllers (USR-N510 RS422),
              SMPS power supplies, and Light Sensors. Climb, Laser Escape, and
              Recipe have dedicated pages.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Controllers (RS422)</Badge>
          <Badge variant="outline">Light Sensors</Badge>
          <Badge variant="outline">24V SMPS</Badge>
          <Badge variant="outline">Ethernet</Badge>
        </div>
      </header>

      {/* Controllers */}
      <Section>
        <H2>Controllers — USR-N510 (RS422)</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Each controller converts RS422 sensor data to Ethernet. Standard units have
          up to four section connectors; Basket Quest and Hexa Quest use a single-channel
          variant. Channels are used left→right.
        </p>

        <ImageWithLabel
          title="Controller Overview"
          image="/docs/hardware/devices/controller-n510.png"
          alt="USR-N510 controller annotated"
          labels={controllerLabels}
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Wrench className="mr-2 inline h-4 w-4" />
                Wiring to sections
              </CardTitle>
              <CardDescription>Per channel / section</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>
                  Terminal order: <code>T+</code> (red), <code>T−</code> (blue/brown),{" "}
                  <code>R+</code> (green), <code>R−</code> (black), <code>GND</code> (white).
                </li>
                <li>Ensure conductors are fully inserted and clamped firmly.</li>
                <li>
                  If the channel LED stays dark: the section may be unpowered (SMPS) or a wire is
                  mis-pinned/loose.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Network className="mr-2 inline h-4 w-4" />
                Accessing the controller
              </CardTitle>
              <CardDescription>Basic connectivity check (read-only)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal pl-5">
                <li>Connect the controller’s Ethernet directly to the Room PC or switch.</li>
                <li>Set the PC’s IPv4 to <code>192.168.0.X</code> (same subnet).</li>
                <li>Open a browser and go to <code>http://192.168.0.7</code>.</li>
                <li>Login (default): <strong>admin / admin</strong>.</li>
                <li>
                  Open <strong>Web to Serial</strong> tab to view incoming data. You should see a steady stream.
                </li>
              </ol>
              <p className="mt-2">
                Avoid changing settings unless you’re a developer. Link LEDs on the Ethernet port
                should blink when connected.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Activity className="mr-2 inline h-4 w-4" />
              Typical channel usage per game
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              <li>Basket Quest / Hexa Quest: 1 channel used (single-connector model).</li>
              <li>Tile Hunt / CTarget / Push Game: ~3 channels used (multi-connector model).</li>
            </ul>
          </CardContent>
        </Card>
      </Section>

      {/* SMPS */}
      <Section>
        <H2>SMPS — 24V 400W</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Two styles are in use: a fan-type chassis with screw terminals, and a block
          style with fixed output leads. Observe DC polarity. Unused outputs should be
          covered. Quantity per room depends on section load.
        </p>

        <ImageWithLabel
          title="SMPS Variants"
          image="/docs/hardware/devices/smps-variants.png"
          alt="SMPS fan and block variants annotated"
          labels={smpsLabels}
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Zap className="mr-2 inline h-4 w-4" />
                Power notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>Polarity matters. Double-check + and − before applying power.</li>
                <li>Place T-connectors mid-section for even power distribution.</li>
                <li>Approximate counts: 6 SMPS in Tile Hunt, Push Game, CTarget (2 per section);
                    2 for Hexa; 1 for Basket.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <ShieldCheck className="mr-2 inline h-4 w-4" />
                Handling & safety
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>Only trained staff should handle AC inputs.</li>
                <li>Power down before reseating any DC connectors.</li>
                <li>Cover/secure any unused DC output leads on block units.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Light Sensors */}
      <Section>
        <H2>Light Sensors</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Sensors within a section are chained using male/female ends. Cabling is 6-pin
          throughout extensions. At the controller, the Yellow conductor is not used.
          Power is injected with a T-connector from the SMPS.
        </p>

        <ImageWithLabel
          title="Sensor Chain & Power Inject"
          image="/docs/hardware/devices/sensors-chain.png"
          alt="Light sensor chain and power T-inject annotated"
          labels={sensorsLabels}
        />

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Cable className="mr-2 inline h-4 w-4" />
              Cabling checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              <li>All 6 wires must pass through extensions; keep order consistent.</li>
              <li>At controller terminals, connect T+, T−, R+, R−, GND (ignore Yellow).</li>
              <li>Place T-power injectors where accessible for maintenance.</li>
            </ul>
          </CardContent>
        </Card>
      </Section>

      {/* Troubleshooting anchor (auto) */}
      <Section last>
        <TroubleshootingAuto />
      </Section>
    </>
  );
}
