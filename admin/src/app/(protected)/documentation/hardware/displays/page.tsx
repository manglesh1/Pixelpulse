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
import { Monitor } from "lucide-react";
import ImageWithLabel, {
  LabelWithMarkerPosition,
} from "@/components/docs/ImageWithLabel";
import TroubleshootingAuto from "@/components/docs/Troubleshooting";

const splitterLabels: LabelWithMarkerPosition[] = [
  {
    n: 1,
    position: { top: "40%", left: "20%" },
    title: "USB 3.0 connection",
    description: "Splitter must be connected directly to the Room PC.",
  },
  {
    n: 2,
    position: { top: "40%", left: "80%" },
    title: "HDMI outputs",
    description: "Two HDMI outputs go to Identifier and Scorecard monitors.",
  },
  {
    n: 3,
    position: { top: "70%", left: "50%" },
    title: "Power input",
    description: "Ensure the splitter has power if required.",
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
            <h1 className="text-2xl font-semibold leading-tight">Room Displays</h1>
            <p className="text-sm text-muted-foreground">
              Two monitors per room (Identifier and Scorecard) connected through a
              USB 3.0 splitter attached directly to the Room Touch PC.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Splitter</Badge>
          <Badge variant="outline">HDMI</Badge>
          <Badge variant="outline">Monitors</Badge>
        </div>
      </header>

      {/* Setup */}
      <Section>
        <H2>Setup at a glance</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          Each room uses a USB splitter connected directly to the Room PC (do not
          connect through a hub). The splitter provides two HDMI outputs for the
          Identifier and Scorecard monitors.
        </p>

        <ImageWithLabel
          title="Splitter and Connections"
          image="/docs/hardware/displays/splitter.png"
          alt="Splitter and monitor connections"
          labels={splitterLabels}
        />
      </Section>

      {/* Driver Reinstall */}
      <Section>
        <H2 id="reinstall-driver">Reinstalling the Splitter Driver</H2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step-by-step process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Exit kiosk mode: open the{" "}
                <Link
                  href="/documentation/software/gameSelection#tips-secret-admin-panel"
                  className="underline"
                >
                  Secret Admin Panel
                </Link>{" "}
                and press <strong>Close Game Selection</strong>.
              </li>
              <li>
                Open <strong>Device Manager</strong>:
                <ul className="list-disc pl-5 mt-1">
                  <li>Press <kbd>Windows</kbd> key.</li>
                  <li>Type <em>Device Manager</em> in the search bar.</li>
                  <li>Select it from the results.</li>
                </ul>
              </li>
              <li>
                Expand <strong>Display adapters</strong>.
              </li>
              <li>
                Find <strong>MacroSilicon USB Display</strong>, right-click, and
                choose <strong>Uninstall device</strong>.
              </li>
              <li>Restart the PC if prompted.</li>
              <li>
                Navigate to{" "}
                <code>C:\Users\aeros\Desktop\Tools\Display_Driver_Second</code>.
              </li>
              <li>
                Run the installer (.exe) and follow the steps on screen.
              </li>
              <li>Restart the PC again if required.</li>
            </ol>
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
