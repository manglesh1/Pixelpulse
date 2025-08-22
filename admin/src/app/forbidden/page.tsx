import { ErrorPage } from "@/components/lib/error-page";

export default function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="Access denied"
      description="You don't have permission to view this page."
      actions={[{ label: "Go Home", href: "/" }]}
    />
  );
}
