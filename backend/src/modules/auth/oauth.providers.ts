import { createHash } from "node:crypto";
import * as oauth from "oauth4webapi";
import * as oidc from "openid-client";
import { importPKCS8, SignJWT } from "jose";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

export type OAuthProvider = "google" | "microsoft" | "apple" | "github";

export interface OAuthTransaction {
  state: string;
  nonce?: string;
  codeVerifier: string;
  linkToUserId?: string;
}

export interface OAuthProfile {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  fullName: string | null;
  avatarUrl: string | null;
}

const providerEnum = {
  google: "GOOGLE",
  microsoft: "MICROSOFT",
  apple: "APPLE",
  github: "GITHUB",
} as const;

const configurationCache = new Map<Exclude<OAuthProvider, "github">, {
  configuration: Promise<oidc.Configuration>;
  expiresAt: number;
}>();
const githubAuthorizationServer: oauth.AuthorizationServer = {
  issuer: "https://github.com",
  authorization_endpoint: "https://github.com/login/oauth/authorize",
  token_endpoint: "https://github.com/login/oauth/access_token",
};

function providerConfigured(provider: OAuthProvider): boolean {
  switch (provider) {
    case "google": return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    case "microsoft": return Boolean(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET);
    case "apple": return Boolean(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
    case "github": return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
  }
}

function requireProvider(provider: OAuthProvider): void {
  if (!providerConfigured(provider)) {
    throw new AppError(503, "OAUTH_NOT_CONFIGURED", `${provider} sign-in is not configured.`);
  }
}

function callbackUri(provider: OAuthProvider): string {
  return new URL(`/api/auth/oauth/${provider}/callback`, env.BACKEND_URL).toString();
}

async function oidcConfiguration(provider: Exclude<OAuthProvider, "github">): Promise<oidc.Configuration> {
  const cached = configurationCache.get(provider);
  if (cached && cached.expiresAt > Date.now()) return cached.configuration;

  const pending = (async () => {
    const clientId = provider === "google"
      ? env.GOOGLE_CLIENT_ID
      : provider === "microsoft"
        ? env.MICROSOFT_CLIENT_ID
        : env.APPLE_CLIENT_ID;
    let clientSecret = provider === "google"
      ? env.GOOGLE_CLIENT_SECRET
      : provider === "microsoft"
        ? env.MICROSOFT_CLIENT_SECRET
        : undefined;
    const issuer = provider === "google"
      ? "https://accounts.google.com"
      : provider === "microsoft"
        ? `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/v2.0`
        : "https://appleid.apple.com";

    if (provider === "apple") {
      const privateKey = await importPKCS8(env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"), "ES256");
      clientSecret = await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID })
        .setIssuer(env.APPLE_TEAM_ID)
        .setSubject(env.APPLE_CLIENT_ID)
        .setAudience("https://appleid.apple.com")
        .setIssuedAt()
        .setExpirationTime("150d")
        .sign(privateKey);
    }

    return oidc.discovery(
      new URL(issuer),
      clientId,
      clientSecret,
      oidc.ClientSecretPost(clientSecret),
    );
  })();

  configurationCache.set(provider, { configuration: pending, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  try {
    return await pending;
  } catch (error) {
    configurationCache.delete(provider);
    throw error;
  }
}

export function getProviderEnum(provider: OAuthProvider) {
  return providerEnum[provider];
}

export async function buildAuthorizationUrl(
  provider: OAuthProvider,
  transaction: OAuthTransaction,
): Promise<URL> {
  requireProvider(provider);
  const redirectUri = callbackUri(provider);

  if (provider === "github") {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state: transaction.state,
      code_challenge: createHash("sha256").update(transaction.codeVerifier).digest("base64url"),
      code_challenge_method: "S256",
    });
    const url = new URL("https://github.com/login/oauth/authorize");
    url.search = params.toString();
    return url;
  }

  const configuration = await oidcConfiguration(provider);
  const parameters: Record<string, string> = {
    redirect_uri: redirectUri,
    scope: provider === "apple" ? "openid email name" : "openid email profile",
    state: transaction.state,
    nonce: transaction.nonce ?? "",
    code_challenge: await oidc.calculatePKCECodeChallenge(transaction.codeVerifier),
    code_challenge_method: "S256",
  };
  if (provider === "apple") parameters.response_mode = "form_post";
  return oidc.buildAuthorizationUrl(configuration, parameters);
}

function stringClaim(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isVerified(value: unknown): boolean {
  return value === true || value === "true";
}

function safeAvatar(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function profileFromClaims(claims: Record<string, unknown>, expectedNonce: string): OAuthProfile {
  const subject = stringClaim(claims.sub);
  const nonce = stringClaim(claims.nonce);
  if (!subject || nonce !== expectedNonce) {
    throw new AppError(401, "OAUTH_INVALID_RESPONSE", "The identity provider returned an invalid sign-in response.");
  }
  const givenName = stringClaim(claims.given_name);
  const familyName = stringClaim(claims.family_name);
  return {
    subject,
    email: stringClaim(claims.email),
    emailVerified: isVerified(claims.email_verified),
    fullName: stringClaim(claims.name) ?? ([givenName, familyName].filter(Boolean).join(" ") || null),
    avatarUrl: safeAvatar(claims.picture),
  };
}

async function githubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ScarfaceEV",
  };
  const userResponse = await fetch("https://api.github.com/user", { headers, signal: AbortSignal.timeout(10_000) });
  if (!userResponse.ok) throw new AppError(502, "OAUTH_PROVIDER_ERROR", "GitHub could not provide the account profile.");
  const user: unknown = await userResponse.json();
  if (typeof user !== "object" || user === null || !("id" in user) || (typeof user.id !== "number" && typeof user.id !== "string")) {
    throw new AppError(502, "OAUTH_PROVIDER_ERROR", "GitHub returned an invalid account profile.");
  }

  const emailResponse = await fetch("https://api.github.com/user/emails", { headers, signal: AbortSignal.timeout(10_000) });
  let email: string | null = null;
  if (emailResponse.ok) {
    const emails: unknown = await emailResponse.json();
    if (Array.isArray(emails)) {
      const match = emails.find((item) =>
        typeof item === "object" && item !== null &&
        "verified" in item && item.verified === true &&
        "primary" in item && item.primary === true &&
        "email" in item && typeof item.email === "string");
      if (match && typeof match.email === "string") email = match.email;
    }
  }

  const record = user as Record<string, unknown>;
  return {
    subject: String(user.id),
    email,
    emailVerified: Boolean(email),
    fullName: stringClaim(record.name) ?? stringClaim(record.login),
    avatarUrl: safeAvatar(record.avatar_url),
  };
}

export async function completeAuthorization(
  provider: OAuthProvider,
  callbackUrl: URL,
  transaction: OAuthTransaction,
  appleName?: string | null,
): Promise<OAuthProfile> {
  requireProvider(provider);

  if (provider === "github") {
    const parameters = oauth.validateAuthResponse(
      githubAuthorizationServer,
      { client_id: env.GITHUB_CLIENT_ID },
      callbackUrl,
      transaction.state,
    );
    const tokenResponse = await oauth.authorizationCodeGrantRequest(
      githubAuthorizationServer,
      { client_id: env.GITHUB_CLIENT_ID },
      oauth.ClientSecretPost(env.GITHUB_CLIENT_SECRET),
      parameters,
      callbackUri(provider),
      transaction.codeVerifier,
    );
    const tokens = await oauth.processAuthorizationCodeResponse(
      githubAuthorizationServer,
      { client_id: env.GITHUB_CLIENT_ID },
      tokenResponse,
    );
    return githubProfile(tokens.access_token);
  }

  const configuration = await oidcConfiguration(provider);
  const tokens = await oidc.authorizationCodeGrant(configuration, callbackUrl, {
    expectedState: transaction.state,
    expectedNonce: transaction.nonce,
    pkceCodeVerifier: transaction.codeVerifier,
  });
  const claims = tokens.claims();
  if (!claims) {
    throw new AppError(401, "OAUTH_INVALID_RESPONSE", "The identity provider did not return a verified identity.");
  }
  const profile = profileFromClaims(claims as Record<string, unknown>, transaction.nonce ?? "");
  if (provider === "apple" && !profile.fullName && appleName) profile.fullName = appleName;
  return profile;
}
