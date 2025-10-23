import { http } from "@/lib/http";

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
  LocationID: number;
};

export type GamesVariant = { ID: number; GameId: number; name: string };

export async function fetchGames(): Promise<Game[]> {
  const res = await http.get("/game/findAll");
  return res.data ?? [];
}

export async function fetchLocations(): Promise<{ LocationID: number; Name: string }[]> {
  const res = await http.get("/location/findAll");
  return res.data ?? [];
}

export async function fetchGamesVariants(): Promise<GamesVariant[]> {
  const res = await http.get("/gamesVariant/findAll");
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
