import { router, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { getAccountType } from "../utils/decodeToken";
import { ApiError } from "./api";
import { getMe, StudentMe } from "./student";

export type RequiredStudentRoute = "/(student)/interests" | "/(student)/leveling-test";
export type StartRoute = RequiredStudentRoute | "/(student)/home" | "/(staff)/home";

export function requiredStudentRoute(me: StudentMe): RequiredStudentRoute | null {
  if (me.interest === null) return "/(student)/interests";
  if (!me.levelingTestCompleted) return "/(student)/leveling-test";
  return null;
}

export async function startRoute(accessToken: string): Promise<StartRoute> {
  if (getAccountType(accessToken) === "staff") return "/(staff)/home";

  try {
    return requiredStudentRoute(await getMe()) ?? "/(student)/home";
  } catch (error) {
    console.warn("Failed to load /me:", error);
    return "/(student)/home";
  }
}

function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.message === "Token expired");
}

export function useRequiredStepCheck() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;

      getMe()
        .then((me) => {
          const required = requiredStudentRoute(me);
          if (required && pathnameRef.current !== required.replace("/(student)", "")) {
            router.replace(required);
          }
        })
        .catch((error) => {
          if (isSessionError(error)) router.replace("/");
          else console.warn("Failed to recheck /me:", error);
        });
    });

    return () => subscription.remove();
  }, []);
}
