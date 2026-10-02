import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/school")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
});
