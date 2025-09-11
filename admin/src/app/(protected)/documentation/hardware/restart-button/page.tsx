import Image from "next/image";
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
} from "@/components/docs/Helpers";
import { Power, RefreshCw, Usb, Lightbulb } from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

const restartButtonLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "40%", left: "50%" },
    title: "LED Button",
    description:
      "Glows/blinks for 10 seconds after a game ends if no players are queued. Press to replay the last game.",
  },
  {
    n: 2,
    position: { top: "85%", left: "60%" },
    title: "USB Cable",
    description:
      "Connects directly to the Room PC. Provides both power (for LEDs) and control signal.",
  },
];

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <RefreshCw className="h-[48px] w-[48px]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Restart Button
            </h1>
            <p className="text-sm text-muted-foreground">
              Room-mounted <strong>USB button</strong> that lets staff replay
              the last game within a short window after it ends.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">USB</Badge>
          <Badge variant="outline">LED</Badge>
          <Badge variant="outline">Replay</Badge>
        </div>
      </header>

      {/* Overview */}
      <Section>
        <H2>Overview</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Each game room has a <strong>Restart Button</strong>. It allows staff
          to quickly replay the most recent game session. The button has an
          integrated LED that blinks for about 10 seconds after a game ends
          (if no players are queued). During this blink window, pressing the
          button restarts the last game with the same settings.
        </p>

        <ImageWithLabel
          title="Restart Button"
          image="/docs/hardware/restart-button/restart-button.png"
          alt="Restart Button with labels"
          labels={restartButtonLabels}
        />
      </Section>

      {/* Operation */}
      <Section>
        <H2>Operation</H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Lightbulb className="mr-2 inline h-4 w-4" />
                LED Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5">
                <li>Blinks for 10 seconds after a game ends.</li>
                <li>Only blinks if no new players are queued in that room.</li>
                <li>During this window, pressing the button restarts the game.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Usb className="mr-2 inline h-4 w-4" />
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5">
                <li>USB connection goes to the Room PC.</li>
                <li>Provides both power for the LED and the signal input.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Daily Checks */}
      <Section>
        <H2>Daily Checks</H2>
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              <li>Confirm the button’s LED blinks after a test game ends.</li>
              <li>Press the button during the blink window; game should restart.</li>
              <li>Ensure USB cable is firmly connected to the Room PC.</li>
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
