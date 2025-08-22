import { ErrorPage } from "@/components/lib/error-page";

export default function UnauthorizedPage() {
  return (
    <ErrorPage
      code="401"
      title="Sign in required"
      description="You need to be signed in to continue."
      actions={[
        { label: "Sign In", href: "/login" },
        { label: "Go Home", href: "/", variant: "outline" },
      ]}
    />
  );
}
