import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";

export const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL;
export const REALM = "matematyka-app";
export const CLIENT_ID = "matematyka-mobile";

const OPENID_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect`;

export async function saveTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync("access_token", accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync("refresh_token", refreshToken);
  }
}

async function clearTokens() {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

export async function logout() {
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  await clearTokens();

  if (refreshToken) {
    AuthSession.revokeAsync(
      { clientId: CLIENT_ID, token: refreshToken, tokenTypeHint: AuthSession.TokenTypeHint.RefreshToken },
      { revocationEndpoint: `${OPENID_URL}/revoke` }
    ).catch((error) => console.warn("Token revocation failed:", error));
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  if (!refreshToken) return null;

  try {
    const result = await AuthSession.refreshAsync(
      { clientId: CLIENT_ID, refreshToken },
      { tokenEndpoint: `${OPENID_URL}/token` }
    );
    await saveTokens(result.accessToken, result.refreshToken);
    return result.accessToken;
  } catch (error) {
    if (error instanceof AuthSession.TokenError) {
      console.warn("Session expired:", error.code);
      await clearTokens();
    } else {
      console.warn("Token refresh failed:", error);
    }
    return null;
  }
}

export async function restoreSession(): Promise<string | null> {
  return (await refreshAccessToken()) ?? (await SecureStore.getItemAsync("access_token"));
}
