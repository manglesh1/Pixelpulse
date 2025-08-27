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
import { ProcessSteps } from "@/components/docs/Process";

export default function Page() {
  return (
    <>
      {/* Hero */}
      <header className="mb-6 rounded-xl border bg-gradient-to-b from-background to-muted/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md border p-2">
            <Image
              src="/docs/pos/pos-icon.png"
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
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/pos/pos-overview.png"
                  alt="POS Overview"
                  fill
                  className="object-contain"
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
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/docs/pos/pos-lookup.png"
                  alt="Lookup page"
                  fill
                  className="object-contain"
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
                  src="/docs/pos/pos-lookup-modal.png"
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
        <p className="text-sm text-muted-foreground pb-4">
          Fully register a family before scanning. Enter email, add names,
          choose time per person, then press <em>Scan</em> beside each person to
          pair a wristband.
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* NEW: Process-driven walkthrough */}
          <ProcessSteps
            title="Registration Process"
            description="Email → (Optional) New Registration → Add Children → Scan per person"
            note="If the email already exists, Step 2 (New Registration panel) does not appear."
            steps={[
              {
                title: "Step 1 — Enter email and Search",
                img: "/docs/pos/register-process-1.png",
                caption: "Type or pick an email, then Search.",
                detail:
                  "If an existing family is found, you jump to the Existing Players grid. If not, the New Registration panel appears.",
              },
              {
                title: "Step 2 — New Registration (only for new email)",
                img: "/docs/pos/register-process-new-player-1.png",
                caption: "Add Parent (and optionally child rows).",
                detail:
                  "When no family exists for this email, enter a Parent Name and add any children. The Register button enables once a parent name is provided.",
              },
              {
                title: "Step 3 — Add Children and Register",
                img: "/docs/pos/register-process-new-player-2.png",
                caption: "Add one or more children.",
                detail:
                  "Add child names (up to 15). Remove with ✕ if needed. Click Register to create records (findOrCreate + findOrCreateChild).",
              },
              {
                title: "Step 4 — Existing Players grid & Scanning",
                img: "/docs/pos/register-process-new-player-3.png",
                caption: "Choose duration, then Scan beside each person.",
                detail:
                  "Pick a duration per row. Press Scan to arm the scanner; a toast prompts which person to scan for.",
              },
              {
                title: "Step 5 — Confirmation and Status",
                img: "/docs/pos/register-process-new-player-4.png",
                caption: "Success toast and updated Time Left.",
                detail:
                  "On success, the grid updates and a success toast shows. If a band has time, you’re prompted to deactivate before reassigning.",
              },
            ]}
          />

          {/* Behavior notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Behavior Notes</CardTitle>
              <CardDescription>From the RegisterViewModel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AdminTile n={1} label="Scan gating">
                Only one active scan at a time; UI shows
                <em> “Please scan a wristband for …”</em>.
              </AdminTile>
              <AdminTile n={2} label="Re-scan safety">
                If a band still has time, the cashier is prompted to deactivate
                before reassigning.
              </AdminTile>
              <AdminTile n={3} label="Toasts">
                Success and error messages appear via toaster notifications.
              </AdminTile>
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
          This does <strong>not</strong> register the guest; guests complete
          registration later at the <em>Registration Stations</em> (tablets).
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          <ProcessSteps
            title="Initialize Process"
            description="Pick duration → Scan → (If needed) confirm reset → Add time"
            note="The flow branches at Step 2. If the wristband has time remaining, staff are prompted to reset it before initializing."
            steps={[
              {
                title: "Step 1 — Choose duration",
                img: "/docs/pos/pos-initialize-process-1.png",
                caption: "Select how much time to load onto the band.",
                detail:
                  "Set the duration first. The primary action is disabled until a scan occurs. The UI shows 'Please Scan a Wristband' while arming the reader.",
              },
              {
                title: "Step 2A — Scan: band has no remaining time",
                img: "/docs/pos/pos-initialize-process-2-without-reset.png",
                caption: "Ready to add time immediately.",
                detail:
                  "If the scanned band is clear/expired, the button switches to <em>Add Time</em>. Pressing it initializes a new R-record and plays the success chime.",
              },
              {
                title: "Step 2B — Scan: band still has time",
                img: "/docs/pos/pos-initialize-process-2-with-reset.png",
                caption: "Reset confirmation dialog appears.",
                detail:
                  "If there’s remaining time on the wristband, a confirmation asks whether to deactivate the old record before re-initializing.",
              },
              {
                title: "Step 3 — Reset and Initialize",
                img: "/docs/pos/pos-initialize-process-3-with-reset.png",
                caption: "Proceed after confirming reset.",
                detail:
                  "On confirm, the old record is deactivated and the action button becomes <em>Reset and Initialize</em>. Press it to create the fresh record with the selected duration and play the success chime.",
              },
            ]}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">When to use</CardTitle>
              <CardDescription>Fast-moving front desk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AdminTile n={1} label="Add Time Only">
                Use for walk-ups or long lines. Guests finish registration on
                tablets.
              </AdminTile>
              <AdminTile n={2} label="Avoid Data Entry">
                No names/emails here—just time credits on the scanned band.
              </AdminTile>
              <AdminTile n={3} label="Reset Prompt">
                If a band has time, the app asks to deactivate before
                re-initializing.
              </AdminTile>
              <AdminTile n={4} label="Toasts">
                Success/error toasts appear.
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
          if valid you can modify time. If expired, you’ll see{" "}
          <em>Ready to renew</em>. Action deactivates the old “R” record and
          creates a new one.
        </p>

        <div className="grid gap-4 xl:grid-cols-2">
          <ProcessSteps
            title="Renew Process"
            description="Pick duration → Scan → Branch depending on state → Modify / Renew → Done"
            steps={[
              {
                title: "Step 1 — Choose duration & wait for scan",
                img: "/docs/pos/pos-renew-process-1.png",
                caption:
                  "Set target time; the action is disabled until a wristband is scanned.",
                detail:
                  "The UI shows 'Waiting for scan…'. Once a UID is received, the app checks for an R-record and whether the band is currently valid.",
              },
              {
                title: "Step 2A — Still active → Modify time",
                img: "/docs/pos/pos-renew-process-with-active-time-already.png",
                caption: "Status: 'Still active – modify time.'",
                detail:
                  "If the wristband is already valid, the primary action becomes <em>Modify Wristband</em>. Pressing it adds time to the active record.",
              },
              {
                title: "Step 2B — Expired → Ready to renew",
                img: "/docs/pos/pos-renew-process-without-active-time.png",
                caption: "Status: 'Ready to renew – set time.'",
                detail:
                  "If the wristband is expired, the primary action becomes <em>Renew Wristband</em>. Pressing it deactivates the old record and creates a fresh one for the selected duration.",
              },
              {
                title: "Step 2C — No record found",
                img: "/docs/pos/pos-renew-process-without-record.png",
                caption: "Status: 'No record – register first.'",
                detail:
                  "When there is no prior R-record for this UID, the cashier must go through the Register flow (or use Initialize if appropriate).",
              },
              {
                title: "Step 3 — Success & reset",
                img: "/docs/pos/pos-renew-process-end.png",
                caption:
                  "Toast confirms result; button resets to 'Scan Wristband'.",
                detail:
                  "On success the UI shows a green confirmation (e.g., 'Wristband renewed (2.0h)') and returns to the idle Scan state for the next guest.",
              },
            ]}
            note="Button label switches between <em>Modify Wristband</em> and <em>Renew Wristband</em> based on validity. All updates are driven by the RenewViewModel’s centralized UpdateUi method."
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Behind the scenes</CardTitle>
              <CardDescription>From the RenewViewModel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  Looks up the previous “R” transaction (inactive allowed) to
                  obtain the
                  <code> PlayerID</code>.
                </li>
                <li>
                  For <em>Renew</em>: deactivates the old record, then
                  initializes a new one with the chosen duration.
                </li>
                <li>
                  For <em>Modify</em>: adds time to the current valid record.
                </li>
                <li>
                  UI state is funneled through a single <code>UpdateUi</code>{" "}
                  dispatcher method (status, button text, toasts).
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
                  reassigning or renewing.
                </li>
                <li>
                  For <strong>Initialize</strong>, remember: this adds time
                  only—registration happens later at the tablets.
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Common issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5">
                <li>
                  <em>No record – register first:</em> Wristband has never been
                  registered. Switch to the Register page.
                </li>
                <li>
                  <em>Still active – modify time:</em> Wristband is valid; use
                  Modify instead of Renew.
                </li>
                <li>
                  <em>Ready to renew – set time:</em> Wristband expired; select
                  a duration and renew.
                </li>
                <li>
                  <em>Deactivation prompt:</em> Appears when trying to
                  reinitialize a band with remaining time.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  );
}
