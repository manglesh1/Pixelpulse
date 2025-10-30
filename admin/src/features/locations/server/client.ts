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
  isActive?: boolean;
};

export async function fetchLocations(): Promise<Location[]> {
  const res = await http.get("/location/findAll");
  return res.data ?? [];
}
export async function createLocation(
  payload: Partial<Location>
): Promise<Location> {
  const res = await http.post("/location/create", payload);
  return res.data;
}

export async function updateLocation(
  id: number,
  payload: Partial<Location>
): Promise<Location> {
  const res = await http.put(`/location/${id}`, payload);
  return res.data;
}

export async function deleteLocation(id: number): Promise<void> {
  await http.delete(`/location/${id}`);
}

export async function disableLocation(id: number): Promise<Location> {
  const res = await http.put(`/location/${id}/disable`);
  return res.data;
}

export async function enableLocation(id: number): Promise<Location> {
  const res = await http.put(`/location/${id}/enable`);
  return res.data;
}
