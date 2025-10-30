import { http } from "@/lib/http";

/* ---------- Types that match Sequelize models ---------- */
export type Game = {
  GameID: number;
  gameCode: string;
  gameName: string;
  createdAt: string;
  MaxPlayers?: number;
  IpAddress?: string;
  LocalPort?: number;
  RemotePort?: number;
  SocketBReceiverPort?: number;
  NoOfControllers?: number;
  NoofLedPerdevice?: number;
  columns?: number;
  introAudio?: string;
};

export type Location = {
  LocationID: number;
  Name: string;
  Address?: string;
  City?: string;
  Province?: string;
  Postal?: string;
  Country?: string;
  Timezone?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
};

export type GamesVariant = {
  ID: number;
  GameID: number;
  name: string;
};

export type GameLocation = {
  id: number;
  GameID: number;
  LocationID: number;
  MaxPlayers?: number | null;
  IpAddress?: string | null;
  LocalPort?: number | null;
  RemotePort?: number | null;
  SocketBReceiverPort?: number | null;
  NoOfControllers?: number | null;
  NoOfLedPerDevice?: number | null;
  columns?: number | null;
  SmartPlugIP?: string | null;
  location?: Location;
};

export type LocationVariant = {
  id: number;
  GameLocationID: number;
  GamesVariantId: number;
  LocationID: number;
  isActive: boolean;
  customConfigJson?: unknown;
};

/* ---------------- Games ---------------- */
export async function fetchGames(): Promise<Game[]> {
  const res = await http.get("/game/findAll");
  return res.data ?? [];
}

export async function createGame(payload: Partial<Game>): Promise<Game> {
  const res = await http.post("/game/create", payload);
  return res.data;
}

export async function updateGame(
  id: number,
  payload: Partial<Game>
): Promise<Game> {
  const res = await http.put(`/game/${id}`, payload);
  return res.data;
}

export async function deleteGame(id: number): Promise<void> {
  await http.delete(`/game/${id}`);
}

/* ---------------- Locations ---------------- */
export async function fetchAllLocations(): Promise<Location[]> {
  const res = await http.get("/location/findAll");
  const data = res.data ?? [];

  return data.filter((loc: Location) => loc.isActive !== false);
}

/* ---------------- Game Variants ---------------- */
export async function fetchGamesVariants(): Promise<GamesVariant[]> {
  const res = await http.get("/gamesVariant/findAll");
  return res.data ?? [];
}

/* ---------------- Game ↔ Location ---------------- */
export async function fetchGameLocations(
  gameId: number
): Promise<GameLocation[]> {
  const res = await http.get(`/gameLocations/findAllByGame/${gameId}`);
  return res.data ?? [];
}

export async function createGameLocation(
  payload: Partial<GameLocation>
): Promise<GameLocation> {
  const res = await http.post("/gameLocations", payload);
  return res.data;
}

export async function deleteGameLocation(id: number): Promise<void> {
  await http.delete(`/gameLocations/${id}`);
}

/* ---------------- Location Variants ---------------- */
export async function fetchLocationVariants(
  gameId: number,
  locationId: number
): Promise<LocationVariant[]> {
  const res = await http.get(
    `/locationVariants?gameId=${gameId}&locationId=${locationId}`
  );
  return res.data ?? [];
}

export async function createLocationVariant(
  payload: Partial<LocationVariant>
): Promise<LocationVariant> {
  const res = await http.post("/locationVariants", payload);
  return res.data;
}

export async function deleteLocationVariant(id: number): Promise<void> {
  await http.delete(`/locationVariants/${id}`);
}
