"use client";

import React, { useEffect, useState } from "react";
import type { CurrentUser, Role } from "@/features/admin/types";
import { ROLE_VALUES } from "@/features/admin/types";
import { registerAdmin } from "@/features/admin/client/register";
import { getAllLocations } from "@/features/admin/client/register";
import type { Location } from "@/features/admin/client/register";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Dark-mode aware Banner
function Banner({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const base = "rounded border px-3 py-2 text-sm";
  const styles =
    kind === "error"
      ? // red
        "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      : kind === "success"
      ? // green
        "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      : // blue (info)
        "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200";

  return (
    <div className={`${base} ${styles}`} role="status" aria-live="polite">
      {children}
    </div>
  );
}

// type guard for Select’s string value
function isRole(value: string): value is Role {
  return (ROLE_VALUES as readonly string[]).includes(value);
}

type ApiError = {
  response?: { data?: { error?: string; message?: string } };
};

export default function AdminPageClient({
  initialUser,
}: {
  initialUser: CurrentUser | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [user] = useState<CurrentUser | null>(initialUser);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await getAllLocations();
        setLocations(res);
      } catch (err) {
        console.error("Failed to load locations:", err);
      }
    }
    loadLocations();
  }, []);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await registerAdmin({ email, password, role, LocationID: locationId });
      setSuccessMsg("User registered successfully!");
      setEmail("");
      setPassword("");
      setRole("user");
    } catch (err: unknown) {
      const apiErr =
        (err as ApiError).response?.data?.error ??
        (err as ApiError).response?.data?.message ??
        (err instanceof Error ? err.message : null);

      setErrorMsg(apiErr || "Registration failed — see console for details.");
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Page wrapper uses theme tokens so colors flip with dark mode
    <div className="min-h-dvh bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Register New User</CardTitle>
            <CardDescription>
              Create a user account and assign a role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <Banner kind="info">
                Logged in as <strong>{user.email}</strong> ({user.role})
              </Banner>
            )}

            {errorMsg && <Banner kind="error">{errorMsg}</Banner>}
            {successMsg && <Banner kind="success">{successMsg}</Banner>}

            <Separator />

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => {
                    if (isRole(v)) setRole(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={locationId?.toString() ?? ""}
                  onValueChange={(v) => setLocationId(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.LocationID}
                        value={loc.LocationID.toString()}
                      >
                        {loc.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering…" : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
