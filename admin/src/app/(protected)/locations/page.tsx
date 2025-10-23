import LocationsTable from "@/features/locations/components/LocationsTable";
import { getCurrentUser } from "@/features/admin/server/client";

export default async function LocationsPage() {
  const user = await getCurrentUser();
  return (
    <section className="p-6">
      <LocationsTable role={user?.role} />
    </section>
  );
}
