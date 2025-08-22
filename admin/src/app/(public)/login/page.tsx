"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { http } from "@/lib/http";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/** Parent component provides the required Suspense boundary */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh grid place-items-center text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

/** This component actually uses useSearchParams */
function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await http.post("/login", { email, password }, { withCredentials: true });
      router.push(redirectTo);
    } catch {
      setErr("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh relative flex items-center justify-center overflow-hidden">
      {/* subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(221_83%_53%/.10),transparent_70%)]" />

      <Card className="relative w-full max-w-md shadow-xl border border-black/5">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/logo.svg"
              alt="Pixelpulse Logo"
              width={32}
              height={32}
              className="rounded-md"
              priority
            />
            <span className="text-sm font-medium text-muted-foreground">
              Pixelpulse Admin
            </span>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to access your dashboard.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-5" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {err && (
              <p className="text-sm text-red-600 -mt-1" role="alert">
                {err}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-850"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
