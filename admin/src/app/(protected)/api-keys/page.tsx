import ApiKeysTable from "@/features/apiKeys/components/ApiKeyTable";

export default async function ApiKeysPage() {
  return (
    <section className="p-6">
      <h1 className="mb-4 text-2xl font-bold">API Keys Management</h1>
      <ApiKeysTable />
    </section>
  );
}
