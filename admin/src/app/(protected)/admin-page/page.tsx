import AdminPageClient from "./AdminPageClient";
import { getCurrentUser } from "@/features/admin/server/user";

export default async function Page() {
  const initialUser = await getCurrentUser();
  return <AdminPageClient initialUser={initialUser} />;
}
