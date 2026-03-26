"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "@/features/admin/server/user";
import {
  ROLE_VALUES,
  type Role,
  type Location,
  type AdminUserRow,
  type CorsOriginRow,
  getAllLocations,
  registerAdmin,
  getAdminUsers,
  updateAdminUser,
  changeAdminUserPassword,
  deleteAdminUser,
  getCorsOrigins,
  createCorsOrigin,
  updateCorsOrigin,
  reloadCorsOrigins,
} from "@/features/admin/server/client";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type ApiError = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

type TabKey = "users" | "cors";
type ModalKey =
  | null
  | "createUser"
  | "editUser"
  | "changePassword"
  | "createCors"
  | "editCors";

type EditingUserState = {
  id: number;
  email: string;
  role: Role;
  LocationID: number | null;
};

type PasswordState = {
  id: number;
  email: string;
  password: string;
};

type CorsFormState = {
  id?: number;
  origin: string;
  description: string;
  isActive: boolean;
};

const EMPTY_CORS_FORM: CorsFormState = {
  origin: "",
  description: "",
  isActive: true,
};

function isRole(value: string): value is Role {
  return (ROLE_VALUES as readonly string[]).includes(value);
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getErrorMessage(err: unknown, fallback: string) {
  return (
    (err as ApiError)?.response?.data?.error ??
    (err as ApiError)?.response?.data?.message ??
    (err instanceof Error ? err.message : fallback)
  );
}

function Banner({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles =
    kind === "error"
      ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
      : kind === "success"
        ? "border-green-300 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200"
        : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "red" | "blue" | "amber" | "gray";
}) {
  const toneMap: Record<string, string> = {
    default:
      "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
    green:
      "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200",
    red: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    gray: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  description,
  onClose,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        className={`w-full ${width} rounded-2xl border bg-background shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function AdminPageClient({
  initialUser,
}: {
  initialUser: CurrentUser | null;
}) {
  const [user] = useState(initialUser);

  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [modal, setModal] = useState<ModalKey>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [corsOrigins, setCorsOrigins] = useState<CorsOriginRow[]>([]);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCors, setLoadingCors] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [corsSearch, setCorsSearch] = useState("");

  const [registering, setRegistering] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingCors, setSavingCors] = useState(false);
  const [reloadingCorsCache, setReloadingCorsCache] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("user");
  const [newUserLocationId, setNewUserLocationId] = useState<number | null>(
    null,
  );

  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [passwordUser, setPasswordUser] = useState<PasswordState | null>(null);

  const [corsForm, setCorsForm] = useState<CorsFormState>(EMPTY_CORS_FORM);

  async function loadLocations() {
    try {
      setLoadingLocations(true);
      const res = await getAllLocations();
      setLocations(res);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to load locations."));
    } finally {
      setLoadingLocations(false);
    }
  }

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const res = await getAdminUsers();
      setUsers(res);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to load users."));
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadCors() {
    try {
      setLoadingCors(true);
      const res = await getCorsOrigins();
      setCorsOrigins(res);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to load CORS origins."));
    } finally {
      setLoadingCors(false);
    }
  }

  useEffect(() => {
    void loadLocations();
    void loadUsers();
    void loadCors();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const locationName =
        locations.find((l) => l.LocationID === u.LocationID)?.Name ?? "";
      return [u.email, u.role, locationName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, userSearch, locations]);

  const filteredCors = useMemo(() => {
    const q = corsSearch.trim().toLowerCase();
    if (!q) return corsOrigins;

    return corsOrigins.filter((c) =>
      [c.origin, c.description ?? "", c.isActive ? "active" : "inactive"]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [corsOrigins, corsSearch]);

  function clearMessages() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  function getLocationName(locationId: number | null) {
    if (locationId == null) return "No location";
    return (
      locations.find((l) => l.LocationID === locationId)?.Name ??
      `Location #${locationId}`
    );
  }

  function getRoleTone(role: Role) {
    switch (role) {
      case "admin":
        return "red";
      case "manager":
        return "blue";
      default:
        return "gray";
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setRegistering(true);

    try {
      await registerAdmin({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        LocationID: newUserLocationId,
      });

      setSuccessMsg("User registered successfully.");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      setNewUserLocationId(null);
      setModal(null);
      await loadUsers();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Registration failed."));
    } finally {
      setRegistering(false);
    }
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    clearMessages();
    setSavingUser(true);

    try {
      await updateAdminUser(editingUser.id, {
        email: editingUser.email,
        role: editingUser.role,
        LocationID: editingUser.LocationID,
      });

      setSuccessMsg("User updated successfully.");
      setEditingUser(null);
      setModal(null);
      await loadUsers();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to update user."));
    } finally {
      setSavingUser(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordUser) return;

    clearMessages();
    setChangingPassword(true);

    try {
      await changeAdminUserPassword(passwordUser.id, {
        password: passwordUser.password,
      });

      setSuccessMsg("Password updated successfully.");
      setPasswordUser(null);
      setModal(null);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to update password."));
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteUser(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?",
    );
    if (!confirmed) return;

    clearMessages();
    setDeletingUserId(id);

    try {
      await deleteAdminUser(id);
      setSuccessMsg("User deleted successfully.");
      await loadUsers();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to delete user."));
    } finally {
      setDeletingUserId(null);
    }
  }

  function openCreateCors() {
    setCorsForm(EMPTY_CORS_FORM);
    setModal("createCors");
  }

  function openEditCors(row: CorsOriginRow) {
    setCorsForm({
      id: row.id,
      origin: row.origin,
      description: row.description ?? "",
      isActive: row.isActive,
    });
    setModal("editCors");
  }

  async function handleSaveCors(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setSavingCors(true);

    try {
      const payload = {
        origin: normalizeOrigin(corsForm.origin),
        description: corsForm.description.trim() || null,
        isActive: corsForm.isActive,
      };

      if (!payload.origin) {
        setErrorMsg("Origin is required.");
        setSavingCors(false);
        return;
      }

      if (corsForm.id) {
        await updateCorsOrigin(corsForm.id, payload);
        setSuccessMsg("CORS origin updated successfully.");
      } else {
        await createCorsOrigin(payload);
        setSuccessMsg("CORS origin created successfully.");
      }

      setCorsForm(EMPTY_CORS_FORM);
      setModal(null);
      await loadCors();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to save CORS origin."));
    } finally {
      setSavingCors(false);
    }
  }

  async function handleToggleCors(row: CorsOriginRow) {
    clearMessages();

    try {
      await updateCorsOrigin(row.id, {
        isActive: !row.isActive,
      });
      setSuccessMsg("CORS origin updated successfully.");
      await loadCors();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to update CORS origin."));
    }
  }

  async function handleReloadCorsCache() {
    clearMessages();
    setReloadingCorsCache(true);

    try {
      await reloadCorsOrigins();
      setSuccessMsg("CORS cache reloaded successfully.");
      await loadCors();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to reload CORS cache."));
    } finally {
      setReloadingCorsCache(false);
    }
  }

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-background p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage users, roles, locations, and API CORS origins from one
              place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setModal("createUser");
              }}
            >
              New User
            </Button>

            <Button type="button" variant="outline" onClick={openCreateCors}>
              New Origin
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReloadCorsCache}
              disabled={reloadingCorsCache}
            >
              {reloadingCorsCache ? "Reloading..." : "Reload CORS Cache"}
            </Button>
          </div>
        </div>

        {user ? (
          <Banner kind="info">
            Logged in as <strong>{user.email}</strong> ({user.role})
          </Banner>
        ) : null}

        {errorMsg ? <Banner kind="error">{errorMsg}</Banner> : null}
        {successMsg ? <Banner kind="success">{successMsg}</Banner> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Admin Users"
            value={users.length}
            hint="Total accounts in the system"
          />
          <StatCard
            label="Allowed Origins"
            value={corsOrigins.filter((x) => x.isActive).length}
            hint="Currently active origins"
          />
          <StatCard
            label="Locations"
            value={locations.length}
            hint={loadingLocations ? "Loading..." : "Available locations"}
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Management</CardTitle>
                <CardDescription>
                  Switch between users and CORS origins.
                </CardDescription>
              </div>

              <div className="inline-flex rounded-xl border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === "users"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Users ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cors")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === "cors"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  CORS Origins ({corsOrigins.length})
                </button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {activeTab === "users" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Input
                    className="max-w-md"
                    placeholder="Search users by email, role, or location..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />

                  <Button
                    type="button"
                    onClick={() => setModal("createUser")}
                    className="md:self-end"
                  >
                    Add User
                  </Button>
                </div>

                <div className="overflow-hidden rounded-xl border">
                  <div className="max-h-[65vh] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                        <tr className="border-b text-left">
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Role</th>
                          <th className="px-4 py-3 font-medium">Location</th>
                          <th className="px-4 py-3 font-medium">Updated</th>
                          <th className="px-4 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingUsers ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              Loading users...
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr
                              key={u.id}
                              className="border-b bg-background transition hover:bg-muted/20"
                            >
                              <td className="px-4 py-3 align-middle font-medium">
                                {u.email}
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <Badge tone={getRoleTone(u.role)}>
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 align-middle text-muted-foreground">
                                {getLocationName(u.LocationID)}
                              </td>
                              <td className="px-4 py-3 align-middle text-muted-foreground">
                                {u.updatedAt
                                  ? new Date(u.updatedAt).toLocaleString()
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingUser({
                                        id: u.id,
                                        email: u.email,
                                        role: u.role,
                                        LocationID: u.LocationID,
                                      });
                                      setModal("editUser");
                                    }}
                                  >
                                    Edit
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPasswordUser({
                                        id: u.id,
                                        email: u.email,
                                        password: "",
                                      });
                                      setModal("changePassword");
                                    }}
                                  >
                                    Password
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={
                                      deletingUserId === u.id ||
                                      user?.id === u.id
                                    }
                                  >
                                    {deletingUserId === u.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Input
                    className="max-w-md"
                    placeholder="Search origins or descriptions..."
                    value={corsSearch}
                    onChange={(e) => setCorsSearch(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openCreateCors}
                    >
                      Add Origin
                    </Button>
                    <Button
                      type="button"
                      onClick={handleReloadCorsCache}
                      disabled={reloadingCorsCache}
                    >
                      {reloadingCorsCache ? "Reloading..." : "Reload Cache"}
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border">
                  <div className="max-h-[65vh] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                        <tr className="border-b text-left">
                          <th className="px-4 py-3 font-medium">Origin</th>
                          <th className="px-4 py-3 font-medium">Description</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Updated</th>
                          <th className="px-4 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingCors ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              Loading CORS origins...
                            </td>
                          </tr>
                        ) : filteredCors.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              No CORS origins found.
                            </td>
                          </tr>
                        ) : (
                          filteredCors.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b bg-background transition hover:bg-muted/20"
                            >
                              <td className="px-4 py-3 align-middle">
                                <code className="rounded bg-muted px-2 py-1 text-xs md:text-sm">
                                  {row.origin}
                                </code>
                              </td>
                              <td className="px-4 py-3 align-middle text-muted-foreground">
                                {row.description || "—"}
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <Badge tone={row.isActive ? "green" : "gray"}>
                                  {row.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 align-middle text-muted-foreground">
                                {row.updatedAt
                                  ? new Date(row.updatedAt).toLocaleString()
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditCors(row)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleCors(row)}
                                  >
                                    {row.isActive ? "Disable" : "Enable"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          open={modal === "createUser"}
          title="Create New User"
          description="Add a new admin, manager, or user account."
          onClose={() => setModal(null)}
        >
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-password">Password</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(v) => {
                    if (isRole(v)) setNewUserRole(v);
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
                  value={newUserLocationId?.toString() ?? "none"}
                  onValueChange={(v) =>
                    setNewUserLocationId(v === "none" ? null : Number(v))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No location</SelectItem>
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={registering || loadingLocations}>
                {registering ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={modal === "editUser" && !!editingUser}
          title="Edit User"
          description="Update email, role, or assigned location."
          onClose={() => {
            setEditingUser(null);
            setModal(null);
          }}
        >
          <form className="space-y-4" onSubmit={handleSaveUser}>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editingUser?.email ?? ""}
                onChange={(e) =>
                  setEditingUser((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev,
                  )
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser?.role ?? "user"}
                  onValueChange={(v) => {
                    if (!isRole(v)) return;
                    setEditingUser((prev) =>
                      prev ? { ...prev, role: v } : prev,
                    );
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
                  value={editingUser?.LocationID?.toString() ?? "none"}
                  onValueChange={(v) =>
                    setEditingUser((prev) =>
                      prev
                        ? {
                            ...prev,
                            LocationID: v === "none" ? null : Number(v),
                          }
                        : prev,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No location</SelectItem>
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingUser(null);
                  setModal(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingUser}>
                {savingUser ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={modal === "changePassword" && !!passwordUser}
          title="Change Password"
          description={`Set a new password for ${passwordUser?.email ?? "this user"}.`}
          onClose={() => {
            setPasswordUser(null);
            setModal(null);
          }}
          width="max-w-lg"
        >
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordUser?.password ?? ""}
                onChange={(e) =>
                  setPasswordUser((prev) =>
                    prev ? { ...prev, password: e.target.value } : prev,
                  )
                }
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordUser(null);
                  setModal(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={modal === "createCors" || modal === "editCors"}
          title={corsForm.id ? "Edit CORS Origin" : "Add CORS Origin"}
          description="Manage allowed frontend origins for the API."
          onClose={() => {
            setCorsForm(EMPTY_CORS_FORM);
            setModal(null);
          }}
        >
          <form className="space-y-4" onSubmit={handleSaveCors}>
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input
                value={corsForm.origin}
                onChange={(e) =>
                  setCorsForm((prev) => ({
                    ...prev,
                    origin: e.target.value,
                  }))
                }
                placeholder="http://localhost:3000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={corsForm.description}
                onChange={(e) =>
                  setCorsForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Only active origins are allowed by CORS.
                </p>
              </div>
              <Switch
                checked={corsForm.isActive}
                onCheckedChange={(checked) =>
                  setCorsForm((prev) => ({
                    ...prev,
                    isActive: checked,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCorsForm(EMPTY_CORS_FORM);
                  setModal(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingCors}>
                {savingCors
                  ? "Saving..."
                  : corsForm.id
                    ? "Save Origin"
                    : "Add Origin"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
