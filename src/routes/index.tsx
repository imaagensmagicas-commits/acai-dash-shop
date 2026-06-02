import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: RedirectToStore,
});

function RedirectToStore() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/loja", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Redirecionando para a loja...</p>
    </div>
  );
}
