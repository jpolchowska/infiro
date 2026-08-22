import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "matematyka-app",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "nextjs-app",
});
