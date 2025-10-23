import { http } from "@/lib/http";

export type ApiKey = {
  id: number;
  name: string;
  key?: string;
  locationId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    LocationID: number;
    Name: string;
  };
};

export async function fetchLocations(): Promise<{ LocationID: number; Name: string }[]> {
  const res = await http.get("/location/findAll");
  return res.data ?? [];
}

// Fetch all API keys (admin only)
export async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await http.get("/apikeys");
  return res.data ?? [];
}

// Create a new API key
export async function createApiKey(payload: {
  name: string;
  locationId: number;
}): Promise<{ apiKey: string }> {
  const res = await http.post("/apikeys", payload);
  return res.data;
}

// Deactivate / revoke an API key
export async function deactivateApiKey(id: number): Promise<void> {
  await http.put(`/apikeys/${id}/deactivate`);
}
