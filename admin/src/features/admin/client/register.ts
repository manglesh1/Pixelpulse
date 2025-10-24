"use client";
import { http } from "@/lib/http";

export type Location = {
  LocationID: number;
  Name: string;
  Address?: string;
  City?: string;
  Province?: string;
  Postal?: string;
  Country?: string;
  Timezone?: string;
};

// Fetch all locations
export async function getAllLocations(): Promise<Location[]> {
  const res = await http.get("/location/findAll", { withCredentials: true });
  return res.data ?? [];
}

// Register a new admin/manager/user account
export async function registerAdmin(input: {
  email: string;
  password: string;
  role: "admin" | "manager" | "user";
  LocationID: number | null;
}) {
  const res = await http.post(
    "/register",
    {
      email: input.email,
      password: input.password,
      role: input.role,
      LocationID: input.LocationID,
    },
    { withCredentials: true }
  );

  return res.data;
}
