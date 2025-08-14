import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface UseAuthRedirectOptions {
  redirectTo?: string;
  redirectIfSignedIn?: boolean;
  redirectIfSignedOut?: boolean;
}

/**
 * Hook for handling authentication-based redirects
 * @param options Configuration for redirect behavior
 * @returns Object with loading state and authentication status
 * 
 * @example
 * // Redirect authenticated users away from auth pages
 * const { isLoading, shouldRedirect } = useAuthRedirect({ 
 *   redirectIfSignedIn: true, 
 *   redirectTo: "/dashboard" 
 * });
 * 
 * @example
 * // Protect private pages by redirecting unauthenticated users
 * const { isLoading, shouldRedirect } = useAuthRedirect({ 
 *   redirectIfSignedOut: true 
 * });
 * 
 * @example
 * // For catchall routes like [...slug] that should redirect based on auth state
 * const { isLoading, isSignedIn, shouldRedirect } = useAuthRedirect({
 *   redirectIfSignedIn: true,
 *   redirectTo: "/dashboard"
 * });
 * if (isLoading || shouldRedirect) return <LoadingComponent />;
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    redirectTo = "/dashboard",
    redirectIfSignedIn = false,
    redirectIfSignedOut = false,
  } = options;

  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (!userLoaded) return;

    if (redirectIfSignedIn && isSignedIn) {
      router.replace(redirectTo);
    } else if (redirectIfSignedOut && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [userLoaded, isSignedIn, router, redirectTo, redirectIfSignedIn, redirectIfSignedOut]);

  return {
    isLoading: !userLoaded,
    isSignedIn,
    shouldRedirect: userLoaded && (
      (redirectIfSignedIn && isSignedIn) || 
      (redirectIfSignedOut && !isSignedIn)
    ),
  };
}

/**
 * Hook specifically for pages that should redirect authenticated users (like sign-in, sign-up)
 * @param redirectTo Where to redirect authenticated users (default: "/dashboard")
 * 
 * @example
 * // In sign-in or sign-up pages
 * const { isLoading, shouldRedirect } = useRedirectIfAuthenticated();
 * if (isLoading || shouldRedirect) return <LoadingSpinner />;
 * 
 * @example
 * // For catchall auth routes like /auth/[...slug]
 * const { isLoading, shouldRedirect } = useRedirectIfAuthenticated("/dashboard");
 * if (isLoading || shouldRedirect) return <div>Redirecting...</div>;
 */
export function useRedirectIfAuthenticated(redirectTo = "/dashboard") {
  return useAuthRedirect({ redirectTo, redirectIfSignedIn: true });
}

/**
 * Hook specifically for protected pages that should redirect unauthenticated users
 * 
 * @example
 * // In protected pages like dashboard, account, admin
 * const { isLoading, shouldRedirect } = useRedirectIfUnauthenticated();
 * if (isLoading || shouldRedirect) return <div>Loading...</div>;
 * 
 * @example
 * // For protected catchall routes like /admin/[...slug]
 * const { isLoading, shouldRedirect, isSignedIn } = useRedirectIfUnauthenticated();
 * if (isLoading || shouldRedirect) return <LoadingComponent />;
 * // Now you know the user is authenticated
 */
export function useRedirectIfUnauthenticated() {
  return useAuthRedirect({ redirectIfSignedOut: true });
}