export const ROLE_VALUES = ["admin", "manager", "user"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export type CurrentUser = {
  id: number;
  email: string;
  role: Role;
};
