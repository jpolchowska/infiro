import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";

export const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL;
export const REALM = "matematyka-app";
export const CLIENT_ID = "matematyka-mobile";

export async function logout() {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  if (!refreshToken) return null;

  try {
    const result = await AuthSession.refreshAsync(
      { clientId: CLIENT_ID, refreshToken },
      { tokenEndpoint: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token` }
    );

    await SecureStore.setItemAsync("access_token", result.accessToken);
    if (result.refreshToken) {
      await SecureStore.setItemAsync("refresh_token", result.refreshToken);
    }
    return result.accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    await logout();
    return null;
  }
}
