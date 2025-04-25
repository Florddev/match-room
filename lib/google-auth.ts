import { SignJWT } from "jose";

// Configuration pour Google OAuth
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.NEXT_PUBLIC_APP_URL + "/api/auth/google/callback",
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
};

// Générer l'URL d'authentification Google
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return `${googleConfig.authUrl}?${params.toString()}`;
}

// Créer un JWT token
export async function createAuthToken(userId: string): Promise<string> {
  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "votre-clé-secrète-super-sécurisée";
  
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(JWT_SECRET_KEY));
  
  return token;
}