import GameLocationConfigTable from "@/features/gameLocationConfig/components/GameLocationConfigTable";
import { getCurrentUser } from "@/features/admin/server/client";

export default async function GameLocationConfigPage() {
  const user = await getCurrentUser();

  return (
    <section className="p-6">
      <GameLocationConfigTable role={user?.role} />
    </section>
  );
}
