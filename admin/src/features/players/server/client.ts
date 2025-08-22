"use server";
import { http } from "@/lib/http";
import type { AxiosError } from "axios";

export type Player = {
  PlayerID: number;
  FirstName: string;
  LastName: string;
  email?: string | null;
  SigneeID?: number | null;
};

export type PagedPlayersResponse = {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
};

export async function fetchPagedPlayers(params: {
  page: number;
  pageSize: number;
  search?: string;
  validOnly?: boolean;
  masterOnly?: boolean;
  playingNow?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<PagedPlayersResponse> {
  const res = await http.get("player/paged", { params });
  return res.data ?? res;
}

/* ---------- details + related ---------- */
export async function fetchPlayerById(id: number) {
  const res = await http.get(`player/${id}`);
  return res.data ?? res;
}
export async function fetchPlayersBySigneeId(signeeId: number) {
  const res = await http.get(`player/findAll`, {
    params: { signeeid: signeeId },
  });
  return res.data ?? res;
}
export async function fetchWristbandsByPlayerID(playerID: number) {
  const res = await http.get(`wristbandtran/findAll`, { params: { playerID } });
  return res.data ?? res;
}
export async function fetchGamesVariants() {
  const res = await http.get(`gamesVariant/findAll`);
  return res.data ?? res;
}
export async function fetchPlayerScoreById(playerId: number) {
  try {
    const res = await http.get(`/playerScore/player/${playerId}`);
    return res.data ?? res;
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;

    if (error.response?.status === 404) {
      return null; // or [] depending on your caller
    }

    console.error(
      "fetchPlayerScoreById error",
      error.response?.data ?? error.message
    );
    throw error;
  }
}

/* ---------- NEW: mutations you used in the old app ---------- */
export async function updatePlayer(id: number, data: Partial<Player>) {
  const res = await http.put(`player/${id}`, data);
  return res.data ?? res;
}
export async function deletePlayer(id: number) {
  await http.delete(`player/${id}`);
}

/** Wristband payload shape your API expects (based on old code) */
export type WristbandUpdatePayload = {
  uid: string; // wristbandCode
  currentstatus?: string; // server accepted in old helper
  status: string; // 'R' | 'I' ...
  playerStartTime: string; // ISO/datetime
  playerEndTime: string; // ISO/datetime
};

export async function updateWristband(data: WristbandUpdatePayload) {
  const res = await http.put(`wristbandtran`, data);
  return res.data ?? res;
}
export async function deleteWristband(id: number) {
  await http.delete(`wristbandtran/${id}`);
}
