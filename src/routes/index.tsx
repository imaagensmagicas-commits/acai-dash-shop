import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  component: RedirectToAdmin,
});

function RedirectToAdmin() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Redirecionando para o painel administrativo...</p>
    </div>
  );
}
