"use client";

import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          General preferences for your account and UI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme and layout density.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme */}
          <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
            <Label>Theme</Label>
            <Select
              value={theme ?? "system"}
              onValueChange={(v: string) => setTheme(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
