import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: RedirectToAdmin,
});

function RedirectToAdmin() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Redirecionando para o painel administrativo...</p>
    </div>
  );
}
