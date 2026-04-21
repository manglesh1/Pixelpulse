import { http } from "@/lib/http";

export type GameLocationConfigRow = {
  id: number;
  GameID: number;
  LocationID: number;
  alias?: string | null;
  isEnabled: boolean;
  IpAddress?: string | null;
  LocalPort?: number | null;
  RemotePort?: number | null;
  SocketBReceiverPort?: number | null;
  NoOfControllers?: number | null;
  NoOfLedPerDevice?: number | null;
  MaxPlayers?: number | null;
  SmartPlugIP?: string | null;
  columns?: number | null;
  /** The per-game-per-location config bag (Location.config is separate). */
  config?: unknown;
  createdAt?: string;
  updatedAt?: string;
  game?: {
    GameID: number;
    gameCode: string;
    gameName: string;
  };
  location?: {
    LocationID: number;
    Name: string;
  };
};

export async function fetchGameLocations(): Promise<GameLocationConfigRow[]> {
  const res = await http.get("/gameLocations");
  return res.data ?? [];
}

export async function updateGameLocationConfig(
  id: number,
  config: unknown,
): Promise<GameLocationConfigRow> {
  const res = await http.put(`/gameLocations/${id}/config`, { config });
  return res.data;
}
