import { ErrorPage } from "@/components/lib/error-page";

export default function InternalServerErrorPage() {
  return (
    <ErrorPage
      code="500"
      title="Server error"
      description="That’s on us. The server had a hiccup. Please try again shortly."
      actions={[
        { label: "Go Home", href: "/" },
        { label: "Try Dashboard", href: "/dashboard", variant: "outline" },
      ]}
    />
  );
}
