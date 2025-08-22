import { ErrorPage } from "@/components/lib/error-page";

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Page not found"
      description="Sorry, we couldn't find the page you're looking for."
      actions={[
        { label: "Go Home", href: "/" },
        { label: "Open Dashboard", href: "/dashboard", variant: "outline" },
      ]}
    />
  );
}
