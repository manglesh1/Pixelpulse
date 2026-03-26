import GamesTable from "@/features/games/components/GamesTable";
import { getCurrentUser } from "@/features/admin/server/user";

export default async function GamesPage() {
  const user = await getCurrentUser();

  return (
    <section className="p-6">
      <GamesTable role={user?.role} />
    </section>
  );
}
