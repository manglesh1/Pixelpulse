import { http } from "@/lib/http";

export type GameLocationConfigRow = {
  id: number;
  GameLocationID: number | null;
  GamesVariantId: number;
  LocationID: number;
  isActive: boolean;
  customConfigJson?: unknown;
  createdAt?: string;
  updatedAt?: string;
  variant?: {
    ID: number;
    name: string;
    GameID: number;
    Game?: {
      GameID: number;
      gameName: string;
      gameCode: string;
    };
  };
  location?: {
    LocationID: number;
    Name: string;
  };
  room?: {
    id: number;
    GameID: number;
    LocationID: number;
  };
};

export async function fetchGameLocationConfigs(params?: {
  search?: string;
  configured?: "true" | "false";
}): Promise<GameLocationConfigRow[]> {
  const query = new URLSearchParams();

  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.configured) query.set("configured", params.configured);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await http.get(`/locationVariants/config-admin${suffix}`);
  return res.data ?? [];
}

export async function fetchGameLocationConfigById(
  id: number
): Promise<GameLocationConfigRow> {
  const res = await http.get(`/locationVariants/${id}/config-admin`);
  return res.data;
}

export async function updateGameLocationConfigJson(
  id: number,
  customConfigJson: unknown
): Promise<GameLocationConfigRow> {
  const res = await http.put(`/locationVariants/${id}/custom-config`, {
    customConfigJson,
  });
  return res.data;
}