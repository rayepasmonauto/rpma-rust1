"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { structuredLogger as logger, LogDomain } from "@/shared/utils";
import { useOnboardingStatus } from "../api/useOnboarding";

const ONBOARDING_ROUTE = "/onboarding";
const SKIP_ONBOARDING_ROUTES = [
  ONBOARDING_ROUTE,
  "/login",
  "/signup",
  "/bootstrap-admin",
];

export function useOnboardingCheck(
  user: { user_id: string } | null,
  authLoading: boolean,
  isAuthenticating: boolean,
) {
  const router = useRouter();
  const pathname = usePathname();

  const shouldSkip =
    authLoading ||
    isAuthenticating ||
    !user ||
    SKIP_ONBOARDING_ROUTES.includes(pathname);

  const { data: status, isLoading: checking } = useOnboardingStatus();

  useEffect(() => {
    if (shouldSkip || !status) return;

    logger.debug(LogDomain.AUTH, "Onboarding check result", {
      completed: status.completed,
      has_organization: status.has_organization,
      has_admin_user: status.has_admin_user,
      pathname,
      user_id: user!.user_id,
    });

    if (!status.completed && pathname !== ONBOARDING_ROUTE) {
      logger.info(LogDomain.AUTH, "Redirecting to onboarding", {
        pathname,
        user_id: user!.user_id,
      });
      router.push(ONBOARDING_ROUTE);
    }
  }, [shouldSkip, status, pathname, router, user]);

  return { checking };
}
