"use client";

import { http } from "@/lib/http";

export const ROLE_VALUES = ["admin", "manager", "user"] as const;
export type Role = (typeof ROLE_VALUES)[number];

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

export type AdminUserRow = {
  id: number;
  email: string;
  role: Role;
  LocationID: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CorsOriginRow = {
  id: number;
  origin: string;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// --------------------
// Locations
// --------------------

export async function getAllLocations(): Promise<Location[]> {
  const res = await http.get("/location/findAll", {
    withCredentials: true,
  });
  return res.data ?? [];
}

// --------------------
// Admin users
// --------------------

export async function registerAdmin(input: {
  email: string;
  password: string;
  role: Role;
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
    { withCredentials: true },
  );

  return res.data;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const res = await http.get("/admin-users", {
    withCredentials: true,
  });
  return res.data ?? [];
}

export async function getAdminUserById(id: number): Promise<AdminUserRow> {
  const res = await http.get(`/admin-users/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function updateAdminUser(
  id: number,
  input: {
    email?: string;
    role?: Role;
    LocationID?: number | null;
  },
) {
  const res = await http.put(`/admin-users/${id}`, input, {
    withCredentials: true,
  });
  return res.data;
}

export async function changeAdminUserPassword(
  id: number,
  input: {
    password: string;
  },
) {
  const res = await http.put(`/admin-users/${id}/password`, input, {
    withCredentials: true,
  });
  return res.data;
}

export async function deleteAdminUser(id: number) {
  const res = await http.delete(`/admin-users/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

// --------------------
// CORS origins
// --------------------

export async function getCorsOrigins(): Promise<CorsOriginRow[]> {
  const res = await http.get("/cors-origins", {
    withCredentials: true,
  });
  return res.data ?? [];
}

export async function getCorsOriginById(id: number): Promise<CorsOriginRow> {
  const res = await http.get(`/cors-origins/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function createCorsOrigin(input: {
  origin: string;
  isActive?: boolean;
  description?: string | null;
}) {
  const res = await http.post(
    "/cors-origins",
    {
      origin: input.origin,
      isActive: input.isActive ?? true,
      description: input.description ?? null,
    },
    { withCredentials: true },
  );

  return res.data;
}

export async function updateCorsOrigin(
  id: number,
  input: {
    origin?: string;
    isActive?: boolean;
    description?: string | null;
  },
) {
  const res = await http.put(`/cors-origins/${id}`, input, {
    withCredentials: true,
  });
  return res.data;
}

export async function reloadCorsOrigins() {
  const res = await http.post(
    "/cors-origins/reload",
    {},
    { withCredentials: true },
  );
  return res.data;
}

export async function deleteCorsOrigin(id: number) {
  const res = await http.delete(`/cors-origins/${id}`, {
    withCredentials: true,
  });
  return res.data;
}
