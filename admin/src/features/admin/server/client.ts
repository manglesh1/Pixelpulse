import "server-only";
import { cookies } from "next/headers";
import { http } from "@/lib/http";

export const ROLE_VALUES = ["admin", "manager", "user"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export type CurrentUser = {
  id: number;
  email: string;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const res = await http.get<CurrentUser>("/me", {
      headers: { cookie: cookieHeader },
      withCredentials: true,
    });
    return res.data ?? null;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 401) return null;
    throw err;
  }
}
