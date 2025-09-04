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
import { Section, H2, AdminTile } from "@/components/docs/Helpers";
import { DoorOpen, PlugZap } from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

const installedLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "50%", left: "25%" },
    title: "Door lock (NO type)",
    description: "Lock engages when powered; releases when power is cut.",
  },
  {
    n: 2,
    position: { top: "55%", left: "70%" },
    title: "Relay (USB to PC)",
    description: "5V relay controlling the door lock power line.",
  },
];

const wiringLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "30%", left: "25%" },
    title: "Power + to Door +",
    description:
      "Positive from DC power supply goes straight to the door lock +.",
  },
  {
    n: 2,
    position: { top: "55%", left: "55%" },
    title: "Door − to COM",
    description: "Door lock negative goes to COM on the relay.",
  },
  {
    n: 3,
    position: { top: "65%", left: "75%" },
    title: "Power − to NO",
    description: "Power supply negative goes to NO on the relay.",
  },
];

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <DoorOpen className="h-[48px] w-[48px]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Door Lock</h1>
            <p className="text-sm text-muted-foreground">
              NO door lock controlled by a 5V USB relay and powered by a DC
              supply. The Room PC (or hub) triggers the relay to unlock the door
              between sessions.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">NO Lock</Badge>
          <Badge variant="outline">USB Relay</Badge>
          <Badge variant="outline">DC Power Supply</Badge>
        </div>
      </header>

      {/* Installed view */}
      <Section>
        <H2>Installed example</H2>
        <ImageWithLabel
          title="Installed lock & relay"
          image="/docs/hardware/door-lock/installed-combined.png"
          alt="Door lock and relay installed"
          labels={installedLabels}
        />
      </Section>

      {/* Wiring diagram */}
      <Section>
        <H2>Wiring diagram</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Positive goes directly to the lock. Negative flows through the relay
          (COM → NO) before returning to the power supply. When triggered, the
          relay completes the circuit and unlocks the door.
        </p>
        <ImageWithLabel
          title="Simple wiring"
          image="/docs/hardware/door-lock/wiring-diagram.png"
          alt="Door lock wiring diagram"
          labels={wiringLabels}
        />
      </Section>

      {/* Operation */}
      <Section>
        <H2>Operation</H2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How it unlocks</CardTitle>
            <CardDescription>Relay path explained</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              <li>Room PC (or hub) sends a trigger to the USB relay.</li>
              <li>Relay closes NO → COM, completing the negative line.</li>
              <li>Door lock receives full power and unlocks.</li>
              <li>When the signal stops, the relay opens and the lock locks again.</li>
            </ul>
          </CardContent>
        </Card>
      </Section>

      {/* Safety and handling */}
      <Section>
        <H2>Safety and handling</H2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <AdminTile n={1} label="Wire terminals">
            Always ensure the relay’s screw terminals are firmly tightened and
            wires are seated according to the wiring diagram.
          </AdminTile>
          <AdminTile n={2} label="USB connection">
            Relay USB can be connected directly to the PC or via a hub.
          </AdminTile>
          <AdminTile n={3} label="Power safety">
            Switch off the DC power supply before reseating wires.
          </AdminTile>
          <AdminTile n={4} label="Mechanical alignment">
            If the lock clicks but the door won’t open, check latch alignment.
          </AdminTile>
        </div>
      </Section>

      {/* Troubleshooting */}
      <Section last>
        <H2>Troubleshooting</H2>
        <TroubleshootingAuto />
      </Section>
    </>
  );
}
