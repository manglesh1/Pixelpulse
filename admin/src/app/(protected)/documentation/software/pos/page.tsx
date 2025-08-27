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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Section,
  H2,
  H3,
  LegendItem,
  Marker,
  AdminTile,
} from "@/components/docs/Helpers";
import {
  CreditCard,
  Search,
  UserPlus,
  Timer,
  RefreshCw,
  Info,
  QrCode,
} from "lucide-react";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <Image
              src="/docs/pos-icon.png"
              alt="POS Icon"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Wristband POS
            </h1>
            <p className="text-sm text-muted-foreground">
              Cashier-facing tools to <strong>look up</strong> guests,{" "}
              <strong>register</strong> families,
              <strong> initialize</strong> (add time without registration), and{" "}
              <strong>renew</strong> expired bands.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">NFC Scanner</Badge>
        </div>
      </header>

      {/* Overview at a glance */}
      <Section>
        <H2>Screen at a glance</H2>
        <p className="mb-3 text-sm text-muted-foreground">
          The POS has <strong>four pages</strong>: Lookup, Register, Initialize,
          and Renew. Only the task-specific tools and panels change.
        </p>

        <div className="grid gap-4 xl:grid-cols-[20fr_7fr] 2xl:grid-cols-[2fr_1fr]">
          {/* Overview image with markers */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">POS Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]">
                <Image
                  src="/docs/pos-overview.png"
                  alt="POS Overview"
                  fill
                  className="object-cover opacity-90"
                  priority
                />
                {/* Markers (aligned to your screenshot) */}
                <Marker n={1} x="9%" y="25%" />{" "}
                {/* Nav buttons: Register/Renew/Lookup/Initialize */}
                <Marker n={2} x="8%" y="95%" /> {/* Connected (NFC status) */}
                <Marker n={3} x="54%" y="47%" />{" "}
                {/* Email input + suggestions caret */}
                <Marker n={4} x="72%" y="47%" /> {/* Search button */}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend</CardTitle>
              <CardDescription>Numbered areas on this screen</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <LegendItem n={1} title="Navigation">
                  <strong>Register</strong>, <strong>Renew</strong>,{" "}
                  <strong>Lookup</strong>, <strong>Initialize</strong>.
                </LegendItem>
                <LegendItem n={2} title="Connected">
                  Green plug = NFC scanner connected and ready.
                </LegendItem>
                <LegendItem n={3} title="Email Input">
                  Type/choose email. Suggestions dropdown appears as you type.
                </LegendItem>
                <LegendItem n={4} title="Search">
                  Looks up family/players for the entered email.
                </LegendItem>
              </ol>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Lookup */}
      <Section>
        <H2> Lookup</H2>
        <p className="text-sm text-muted-foreground">
          Search players and families, filter by validity or activity, open
          details, add/revoke time, change names/emails, and inspect wristband
          status.
        </p>

        {/* Main lookup screen */}
        <div className="grid gap-4 xl:grid-cols-[20fr_7fr] 2xl:grid-cols-[2fr_1fr]">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lookup UI</CardTitle>
              <CardDescription>
                Search, filters, paging, and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]">
                <Image
                  src="/docs/pos-lookup.png"
                  alt="Lookup page"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Markers aligned to your screenshot */}
                <Marker n={4} x="27%" y="7%" /> {/* Search input */}
                <Marker n={5} x="51%" y="7%" /> {/* Filter checkboxes */}
                <Marker n={6} x="66%" y="7%" /> {/* Refresh button */}
                <Marker n={8} x="94%" y="30%" /> {/* DETAILS buttons */}
                <Marker n={9} x="52%" y="93%" />{" "}
                {/* Pagination (Prev / page / Next) */}
              </div>
            </CardContent>
          </Card>

          {/* Legend for main screen */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend — Lookup</CardTitle>
              <CardDescription>Numbered areas on this screen</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <LegendItem n={4} title="Search">
                  Free-text search on players/families.
                </LegendItem>
                <LegendItem n={5} title="Filters">
                  Valid only • Master only • Playing now.
                </LegendItem>
                <LegendItem n={6} title="Refresh">
                  Reload results with current filters.
                </LegendItem>
                <LegendItem n={8} title="Details">
                  Opens Player Details modal for actions.
                </LegendItem>
                <LegendItem n={9} title="Pagination">
                  10 per page; Prev/Next navigation.
                </LegendItem>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Player details modal (screenshot) */}
        <div className="mt-4 grid gap-4 xl:grid-cols-[20fr_7fr] 2xl:grid-cols-[2fr_1fr]">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Player Details (Modal)
              </CardTitle>
              <CardDescription>
                Edit info, view wristbands, add time, deactivate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]">
                <Image
                  src="/docs/pos-lookup-modal.png"
                  alt="Player Details modal"
                  fill
                  className="object-contain"
                />
                {/* Markers for the modal */}
                <Marker n={1} x="8%" y="7%" /> {/* Title: Child of Player … */}
                <Marker n={2} x="10%" y="12%" /> {/* Tabs: Info / Top Scores */}
                <Marker n={3} x="48%" y="18%" /> {/* Editable fields row */}
                <Marker n={4} x="14%" y="23%" /> {/* Valid only checkbox */}
                <Marker n={5} x="13%" y="32%" /> {/* Wristbands table header */}
                <Marker n={6} x="82%" y="40%" /> {/* ADD TIME button */}
                <Marker n={8} x="14%" y="70%" /> {/* Children section */}
                <Marker n={9} x="92%" y="94%" /> {/* SAVE PLAYER */}
              </div>
            </CardContent>
          </Card>

          {/* Legend for modal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Legend — Player Details
              </CardTitle>
              <CardDescription>Numbered areas in the modal</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <LegendItem n={1} title="Header">
                  Player context; “view parent” link when viewing a child.
                </LegendItem>
                <LegendItem n={2} title="Tabs">
                  Info and Top Scores.
                </LegendItem>
                <LegendItem n={3} title="Profile Fields">
                  Edit first/last name and email.
                </LegendItem>
                <LegendItem n={4} title="Valid Only">
                  Filters wristbands to active ones.
                </LegendItem>
                <LegendItem n={5} title="Wristbands">
                  Code • Status • Start/End • Actions.
                </LegendItem>
                <LegendItem n={6} title="Add Time/ Deactivate">
                  Extend time or deactivate the selected band.
                </LegendItem>
                <LegendItem n={8} title="Children">
                  Linked child accounts (if any).
                </LegendItem>
                <LegendItem n={9} title="Save / Close">
                  Persist edits or dismiss changes.
                </LegendItem>
              </ol>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Register */}
      <Section>
        <H2>
          <UserPlus className="h-5 w-5" /> Register
        </H2>
        <p className="text-sm text-muted-foreground">
          Use when you want to fully register a family before scanning. Enter
          email, parent name, add child names, choose time per person, then
          press <em>Scan</em> beside each person to pair a band.
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Register Flow</CardTitle>
              <CardDescription>
                Email → Parent → Children → Scan each
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/pos-register.png" // TODO
                  alt="Register page"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Mini mock of scan affordance */}
              <div className="mt-4 rounded-md border p-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="grow">
                    <label className="block text-xs text-muted-foreground">
                      Email
                    </label>
                    <Input
                      placeholder="guest@email.com"
                      readOnly
                      value="guest@example.com"
                    />
                  </div>
                  <div className="grow">
                    <label className="block text-xs text-muted-foreground">
                      Parent Name
                    </label>
                    <Input readOnly value="Taylor Swift" />
                  </div>
                  <div className="w-40">
                    <label className="block text-xs text-muted-foreground">
                      Time
                    </label>
                    <Input readOnly value="1.0 hr" />
                  </div>
                  <Button size="sm" className="shrink-0" disabled>
                    <QrCode className="mr-2 h-4 w-4" /> Scan
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Scan is enabled only when the person doesn’t already have a
                  valid wristband.
                </p>
              </div>

              <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                <li>
                  Email suggestions show as you type; pick one to pre-fill
                  families if they exist.
                </li>
                <li>
                  Registering creates/updates the parent and creates any new
                  child records.
                </li>
                <li>
                  Each <em>Scan</em> associates the band to that person and
                  initializes time.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Behavior Notes</CardTitle>
              <CardDescription>From the RegisterViewModel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  <strong>Scan gating:</strong> Only one active scan at a time;
                  UI shows “Please scan a wristband for …”.
                </li>
                <li>
                  <strong>Master-band rule:</strong> If the selected parent has
                  a valid “R” ≥ 1 day, child registration is disabled.
                </li>
                <li>
                  <strong>Re-scan safety:</strong> If a band still has time,
                  cashier is prompted to deactivate before reassigning.
                </li>
                <li>
                  <strong>Toasts:</strong> Success/errors appear via the toaster
                  message channel.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Initialize */}
      <Section>
        <H2>
          <Timer className="h-5 w-5" /> Initialize
        </H2>
        <p className="text-sm text-muted-foreground">
          Quick add-time path. Cashier scans a band and taps <em>Add Time</em>.
          This does <strong>not</strong> register the guest. Guests must
          register themselves later at the <em>Registration Stations</em>{" "}
          (tablets).
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Initialize UI</CardTitle>
              <CardDescription>Scan → Add Time → Toast</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/pos-initialize.png" // TODO
                  alt="Initialize page"
                  fill
                  className="object-contain"
                />
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                <li>Plays a success chime on completion.</li>
                <li>
                  If the band still has time, prompts to reset before adding new
                  time.
                </li>
                <li>
                  Toast popup anchors to the view; messages clear after showing.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">When to use</CardTitle>
              <CardDescription>Fast-moving front desk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AdminTile n={1} label="Add Time Only">
                Use for walk-ups or when the line is long. Guests finish
                registration on tablets.
              </AdminTile>
              <AdminTile n={2} label="Avoid Data Entry">
                No names/emails here—just time credits on the scanned band.
              </AdminTile>
              <AdminTile n={3} label="Registration Later">
                On scanners at the registration stations, guests link bands to
                their info.
              </AdminTile>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Renew */}
      <Section>
        <H2>
          <RefreshCw className="h-5 w-5" /> Renew
        </H2>
        <p className="text-sm text-muted-foreground">
          For expired (or soon-to-expire) registered bands. Scan to check state;
          if valid, you can modify time. If expired, you’ll see{" "}
          <em>Ready to renew</em>. Action deactivates the old “R” record and
          creates a fresh one.
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Renew UI</CardTitle>
              <CardDescription>Scan → Check → Renew/Modify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/pos-renew.png" // TODO
                  alt="Renew page"
                  fill
                  className="object-contain"
                />
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                <li>
                  Status shows: <em>Checking…</em>, then either{" "}
                  <em>Still active – modify time</em> or{" "}
                  <em>Ready to renew – set time</em>.
                </li>
                <li>
                  Button text switches between <em>Modify Wristband</em> and{" "}
                  <em>Renew Wristband</em>.
                </li>
                <li>
                  On success, toast confirmation and reset to{" "}
                  <em>Scan Wristband</em>.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Behind the scenes</CardTitle>
              <CardDescription>From the RenewViewModel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  Finds the last “R” record (inactive allowed) to recover{" "}
                  <code>PlayerID</code>.
                </li>
                <li>
                  Deactivates old record, then initializes a new one with chosen
                  duration.
                </li>
                <li>
                  UI is driven through a centralized <code>UpdateUi</code>{" "}
                  method on the dispatcher.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Troubleshooting */}
      <Section last>
        <H2>Troubleshooting</H2>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scanner tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  If the scan prompt is disabled, you may already be scanning
                  for a person (cancel first).
                </li>
                <li>
                  If a band still has time, you’ll be asked to deactivate before
                  reassigning/renewing.
                </li>
                <li>
                  For Initialize, remember: this adds time only—registration
                  happens later at the tablets.
                </li>
              </ul>
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4" />
                <p>
                  Button availability depends on selection and state (valid
                  band, chosen duration, etc.).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Placeholder: Error Examples
              </CardTitle>
              <CardDescription>
                Use screenshots of common toasts/modals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/pos-errors.png" // TODO
                  alt="Error & toast examples"
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  );
}
