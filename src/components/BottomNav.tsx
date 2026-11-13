import { useRouterState } from "@tanstack/react-router";
import { useCommunity } from "./CommunityProvider";

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useCommunity();
  // The authenticated home has its own compact commerce navigation.
  if (pathname === "/" || pathname.startsWith("/creator") || (user && pathname === "/")) return null;
  return null;
}
