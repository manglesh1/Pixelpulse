import VariantsTable from "@/features/gamesVariants/components/VariantsTable";
import { getCurrentUser } from "@/features/admin/server/user";

export default async function GamesVariantsPage() {
  const user = await getCurrentUser();

  return (
    <section className="p-6">
      <VariantsTable role={user?.role} />
    </section>
  );
}
