import ConfigsTable from "@/features/configs/components/ConfigsTable";
import { getCurrentUser } from "@/features/admin/server/client";

export default async function ConfigPage() {
  const user = await getCurrentUser();
  return (
    <section className="p-6">
      <ConfigsTable role={user?.role} />
    </section>
  );
}
