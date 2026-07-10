import { useCallback } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";

// Guests can browse Realstarcy freely (TikTok-style), but interacting
// (love, comment, follow, post) requires an account. `guard` runs the
// given action only when signed in; otherwise it sends the visitor to
// sign-in instead of silently failing on a 401.
export function useAuthGuard() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  const guard = useCallback(
    (action: () => void) => {
      if (isSignedIn) {
        action();
      } else {
        setLocation("/sign-in");
      }
    },
    [isSignedIn, setLocation],
  );

  return { isSignedIn: !!isSignedIn, guard };
}
