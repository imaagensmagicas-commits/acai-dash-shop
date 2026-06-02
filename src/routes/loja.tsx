import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/loja")({
  component: RedirectToStore,
});

function RedirectToStore() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/loja", replace: true });
  }, [navigate]);

  return null;
}
