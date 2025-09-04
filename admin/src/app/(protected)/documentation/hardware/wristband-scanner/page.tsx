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
import { Usb, Activity, ScanBarcode, PlugZap } from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

// Labels for the merged interior photo:
// - Arduino Nano (drives LEDs; ideally direct USB to PC for stable power)
// - NFC Reader board
// - Status LEDs
// - USB for Arduino
// - USB for NFC reader
const insideLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "22%", left: "28%" },
    title: "Arduino Nano",
    description:
      "Drives the scanner’s LED lighting and adapts brightness based on available USB power.",
  },
  {
    n: 2,
    position: { top: "65%", left: "30%" },
    title: "NFC Reader",
    description: "Reads the wristband’s NFC UID for POS/Registration.",
  },
  {
    n: 3,
    position: { top: "38%", left: "62%" },
    title: "Lighting LEDs",
    description:
      "The actual illumination for the scanner window. Brightness may vary by room due to PC USB power; firmware adapts automatically.",
  },
  {
    n: 4,
    position: { top: "85%", left: "55%" },
    title: "USB (Arduino)",
    description:
      "Prefer direct to Room PC for the most stable power (helps LED lighting).",
  },
  {
    n: 5,
    position: { top: "85%", left: "75%" },
    title: "USB (NFC Reader)",
    description: "Can go via hub; ensure a snug connection.",
  },
];

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <ScanBarcode className="h-[48px] w-[48px]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Wristband Scanner
            </h1>
            <p className="text-sm text-muted-foreground">
              NFC hand scanner assembly with integrated LEDs. Used at POS,
              Registration tablets, and in rooms for validating/starting
              sessions.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">NFC</Badge>
          <Badge variant="outline">Arduino Nano</Badge>
          <Badge variant="outline">USB x2</Badge>
        </div>
      </header>

      {/* Installed photo (no labels) */}
      <Section>
        <H2>Installed view</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Typical mounting near the Room Touch PC or front desk. Hold the
          wristband close to the reader surface to scan.
        </p>
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scanner — installed</CardTitle>
            <CardDescription>
              External enclosure and reader surface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
              <Image
                src="/docs/hardware/wristband-scanner/installed.png"
                alt="Installed wristband scanner"
                fill
                className="object-contain"
                priority
              />
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Interior + connections (labeled) */}
      <Section>
        <H2>Inside & connections</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          The scanner uses two USB connections: one for the Arduino Nano (LED
          control) and one for the NFC reader board.
        </p>

        <ImageWithLabel
          title="Interior & USB connections"
          image="/docs/hardware/wristband-scanner/inside-merged.png"
          alt="Scanner interior and USB connections"
          labels={insideLabels}
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Activity className="mr-2 inline h-4 w-4" />
                Operation
              </CardTitle>
              <CardDescription>What each part does</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>
                  Present a wristband near the reader; the NFC board reads its
                  UID.
                </li>
                <li>
                  The Arduino Nano powers and controls the scanner’s lighting
                  LEDs. It automatically adapts brightness based on the USB
                  power available from the connected PC.
                </li>
                <li>
                  Apps (POS/Registration/Game Selection) use the UID to identify
                  the guest.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Usb className="mr-2 inline h-4 w-4" />
                Cabling & power notes
              </CardTitle>
              <CardDescription>Keep it stable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>Ensure both USB plugs are fully seated.</li>
                <li>
                  Prefer the Arduino Nano’s USB directly to the Room PC for
                  clean power to the LEDs.
                </li>
                <li>
                  NFC reader’s USB can go to a hub if needed; avoid loose or
                  long/flimsy cables.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Quick tips */}
      <Section>
        <H2>Daily checks</H2>
        <div className="space-y-2 text-sm">
          <AdminTile n={1} label="LEDs light up">
            After boot, LEDs should show the ready state. If dark, check the
            Arduino USB is connected to the PC.
          </AdminTile>
          <AdminTile n={2} label="Test scan">
            Use POS or Registration to scan a known wristband and confirm the
            UID is detected.
          </AdminTile>
          <AdminTile n={3} label="Cable strain">
            Make sure USB cables aren’t pinched or under tension at the
            enclosure exit.
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
