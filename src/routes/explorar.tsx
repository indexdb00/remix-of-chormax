import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/explorar")({
  beforeLoad: () => { throw redirect({ to: "/feed" }); },
  component: () => null,
});
