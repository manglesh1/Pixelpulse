import { http } from "@/lib/http";

export type ConfigRow = {
  id: number;
  configKey: string;
  configValue: string;
  GamesVariantId: number | "" | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchConfigs(): Promise<ConfigRow[]> {
  const res = await http.get("/config/findAll");
  return (res.data as ConfigRow[]) ?? [];
}

export async function createConfig(payload: Omit<ConfigRow, "id">) {
  const res = await http.post("/config/create", payload);
  return res.data as ConfigRow;
}

export async function updateConfig(id: number, payload: Partial<ConfigRow>) {
  const res = await http.put(`/config/${id}`, payload);
  return res.data as ConfigRow;
}

export async function deleteConfig(id: number) {
  await http.delete(`/config/${id}`);
}

/** For the variant dropdown */
export type GamesVariant = { ID: number; name: string };
export async function fetchGamesVariants(): Promise<GamesVariant[]> {
  const res = await http.get("/gamesVariant/findAll");
  return (res.data as GamesVariant[]) ?? [];
}
