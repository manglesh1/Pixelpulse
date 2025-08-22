"use client";
import { http } from "@/lib/http";

export async function registerAdmin(input: {
  email: string;
  password: string;
  role: "admin" | "manager" | "user" | string;
}) {
  const res = await http.post(
    "/register",
    { email: input.email, password: input.password, role: input.role },
    { withCredentials: true }
  );
  return res.data;
}
