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
  Speaker,
  Volume2,
  Power,
  Usb,
  Cable,
  Wrench,
  Waves,
} from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

/**
 * Labels for the standard 2.1 layout image
 * (2 speakers + subwoofer + controller/amp + PC connection)
 */
const standardAudioLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "40%", left: "22%" },
    title: "Left Speaker",
    description: "Powered from the subwoofer. Audio signal via speaker wire.",
  },
  {
    n: 2,
    position: { top: "40%", left: "78%" },
    title: "Right Speaker",
    description: "Powered from the subwoofer. Audio signal via speaker wire.",
  },
  {
    n: 3,
    position: { top: "72%", left: "50%" },
    title: "Subwoofer",
    description:
      "Power in; distributes power/signal to speakers and controller.",
  },
  {
    n: 4,
    position: { top: "25%", left: "50%" },
    title: "Controller / Amplifier",
    description:
      "Volume knob; connects to PC via 3.5mm jack (or USB audio adapter).",
  },
  {
    n: 5,
    position: { top: "88%", left: "15%" },
    title: "To PC (3.5mm or USB)",
    description: "Controller → PC with 3.5mm jack or 3.5mm→USB converter.",
  },
  {
    n: 6,
    position: { top: "88%", left: "85%" },
    title: "Controller Extension",
    description: "3-pin extension cable from subwoofer to controller.",
  },
];

/**
 * Labels for Tile Hunt (5.1) diagram
 */
const tileHuntLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "20%", left: "20%" },
    title: "Front / Surround Speakers (x5)",
    description: "All speakers get power/signal from the subwoofer unit.",
  },
  {
    n: 2,
    position: { top: "65%", left: "25%" },
    title: "Subwoofer",
    description:
      "Central hub: speaker power/signal + controller + 3×3.5mm to sound card.",
  },
  {
    n: 3,
    position: { top: "22%", left: "75%" },
    title: "Controller",
    description: "Volume knob. Turning once clears the startup static.",
  },
  {
    n: 4,
    position: { top: "86%", left: "58%" },
    title: "5.1 USB Sound Card",
    description:
      "Connects to PC via USB; 3×3.5mm to subwoofer (Front/Rear/Center+Sub).",
  },
  {
    n: 5,
    position: { top: "86%", left: "85%" },
    title: "USB to PC",
    description: "Sound card’s USB cable should run straight to the PC.",
  },
];

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <Speaker className="h-[48px] w-[48px]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Speakers</h1>
            <p className="text-sm text-muted-foreground">
              Each room uses an audio kit driven by the Room PC. Standard rooms
              have two speakers, one subwoofer, and a controller. Push Game uses
              a Bose kit. Tile Hunt uses a 5.1 surround system with a USB sound
              card.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">2.1 Audio</Badge>
          <Badge variant="outline">Bose (Push Game)</Badge>
          <Badge variant="outline">5.1 Surround (Tile Hunt)</Badge>
          <Badge variant="outline">3.5mm / USB Audio</Badge>
        </div>
      </header>

      {/* Standard 2.1 Setup */}
      <Section>
        <H2>Standard Rooms — 2.1 Setup</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Most rooms use two speakers, one subwoofer, and a controller. The
          controller connects to the PC using a 3.5&nbsp;mm jack or a
          3.5&nbsp;mm-to-USB adapter. 
        </p>

        <ImageWithLabel
          title="Standard Audio Layout"
          image="/docs/hardware/speakers/standard-2-1.png"
          alt="Standard speakers diagram (2.1)"
          labels={standardAudioLabels}
        />
      </Section>

      {/* Connections & Output selection */}
      <Section>
        <H2>Connections & Output</H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Cable className="mr-2 inline h-4 w-4" />
                Cabling checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>
                  Speakers and controller plug into the subwoofer for
                  power/signal.
                </li>
                <li>
                  Controller connects to the PC via 3.5&nbsp;mm jack or a
                  3.5&nbsp;mm→USB adapter.
                </li>
                <li>Can use hub port for USB audio when possible.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Volume2 className="mr-2 inline h-4 w-4" />
                Select the correct output
              </CardTitle>
              <CardDescription>
                When audio plays to the wrong device or is silent
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal pl-5">
                <li>
                  Open the{" "}
                  <Link
                    href="/documentation/software/gameSelection#tips-secret-admin-panel"
                    className="underline"
                  >
                    Secret Admin Panel
                  </Link>{" "}
                  and press <strong>Close Game Selection</strong> to exit kiosk
                  mode.
                </li>
                <li>Right-click the speaker icon on the Windows taskbar.</li>
                <li>
                  Choose <strong>Sound settings</strong> → pick the intended
                  speakers/output.
                </li>
                <li>
                  Play a short test sound; verify the controller volume is up.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Push Game — Bose */}
      <Section>
        <H2>Push Game — Bose Speakers</H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Behavior</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>Does not auto-power on with main power.</li>
                <li>
                  Tap the top of the circular controller (beside the subwoofer)
                  to turn it on.
                </li>
                <li>Rotate the top ring to adjust volume.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Power className="mr-2 inline h-4 w-4" />
                Quick checks
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>Ensure the controller is awake (tap top surface).</li>
                <li>
                  Confirm the PC output device is set to the Bose speakers.
                </li>
                <li>
                  Check the controller cable and PC connection (3.5&nbsp;mm or
                  USB).
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Tile Hunt — 5.1 surround */}
      <Section>
        <H2>Tile Hunt — 5.1 Surround</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Tile Hunt uses five speakers, one subwoofer, a controller, and a 5.1
          USB sound card. The subwoofer distributes power and signal to the
          speakers and controller. Three 3.5&nbsp;mm cables run from the
          subwoofer to the sound card (Front, Rear, Center/Sub). The sound card
          connects to the PC via USB.
        </p>

        <ImageWithLabel
          title="Tile Hunt 5.1 Layout"
          image="/docs/hardware/speakers/tilehunt-5-1.png"
          alt="Tile Hunt 5.1 surround diagram"
          labels={tileHuntLabels}
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Waves className="mr-2 inline h-4 w-4" />
                Startup static
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>
                  When power is first applied, a static sound is normal until
                  the controller volume knob is turned once.
                </li>
                <li>
                  Static also occurs if the PC isn’t sending audio; selecting
                  the correct output device resolves it.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Usb className="mr-2 inline h-4 w-4" />
                USB Sound Card tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5">
                <li>
                  Verify all three 3.5&nbsp;mm cables are firmly seated at the
                  subwoofer and the card.
                </li>
                <li>
                  Select the sound card as the Windows output device when using
                  5.1.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Everyday Tips */}
      <Section last>
        <H2>Everyday Tips</H2>
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              <li>
                If speakers produce static: confirm the PC is powered and the
                output device is set correctly (see “Select the correct output”
                above).
              </li>
              <li>
                Reseat the controller-to-PC connection (3.5&nbsp;mm or USB). Use
                a direct PC port for USB audio devices when possible.
              </li>
              <li>
                On Tile Hunt: turn the controller knob once after power-up to
                clear the initial static.
              </li>
              <li>
                On Push Game (Bose): tap the controller’s top to power it on;
                adjust volume by rotating the ring.
              </li>
            </ul>
          </CardContent>
        </Card>
      </Section>
      {/* Troubleshooting */}
      <Section last>
        <H2>Troubleshooting</H2>
        <TroubleshootingAuto />
      </Section>
    </>
  );
}
