import { beforeEach, describe, expect, it, vi } from "vitest";

const oidcMocks = vi.hoisted(() => ({
  discovery: vi.fn(async (_issuer: URL) => ({ discovered: true })),
  ClientSecretPost: vi.fn((_secret: string | undefined) => ({ clientSecret: _secret })),
  calculatePKCECodeChallenge: vi.fn(async (_verifier: string) => "calculated-challenge"),
  buildAuthorizationUrl: vi.fn(() => new URL("https://provider.test/authorize")),
  authorizationCodeGrant: vi.fn(),
  importPKCS8: vi.fn(async (_key: string, _algorithm: string) => ({ privateKey: true })),
}));

vi.mock("../src/config/env.js", () => ({
  env: {
    BACKEND_URL: "https://api.example.test",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
    GOOGLE_CALLBACK_URL: "https://api.example.test/api/auth/oauth/google/callback",
    APPLE_CLIENT_ID: "apple-service-id",
    APPLE_TEAM_ID: "apple-team-id",
    APPLE_KEY_ID: "apple-key-id",
    APPLE_CALLBACK_URL: "https://api.example.test/api/auth/oauth/apple/callback",
    APPLE_PRIVATE_KEY_PATH: "",
    APPLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nplaceholder\\n-----END PRIVATE KEY-----",
    MICROSOFT_CLIENT_ID: "",
    MICROSOFT_CLIENT_SECRET: "",
    MICROSOFT_TENANT_ID: "consumers",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
  },
}));
vi.mock("openid-client", () => ({
  discovery: oidcMocks.discovery,
  ClientSecretPost: oidcMocks.ClientSecretPost,
  calculatePKCECodeChallenge: oidcMocks.calculatePKCECodeChallenge,
  buildAuthorizationUrl: oidcMocks.buildAuthorizationUrl,
  authorizationCodeGrant: oidcMocks.authorizationCodeGrant,
}));
vi.mock("jose", () => {
  class MockSignJWT {
    setProtectedHeader() { return this; }
    setIssuer() { return this; }
    setSubject() { return this; }
    setAudience() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return "signed-apple-client-secret"; }
  }
  return {
    importPKCS8: oidcMocks.importPKCS8,
    SignJWT: MockSignJWT,
  };
});

import { buildAuthorizationUrl, completeAuthorization } from "../src/modules/auth/oauth.providers.js";

const claims = {
  sub: "stable-provider-subject",
  nonce: "expected-nonce",
  email: "private-relay@privaterelay.appleid.com",
  email_verified: true,
};

describe("OIDC authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oidcMocks.discovery.mockResolvedValue({ discovered: true });
    oidcMocks.authorizationCodeGrant.mockResolvedValue({ claims: () => claims });
  });

  it("uses configured callback URLs and binds Google authorization to state, nonce, and PKCE", async () => {
    const url = await buildAuthorizationUrl("google", {
      state: "state",
      nonce: "expected-nonce",
      codeVerifier: "verifier",
    });

    expect(url.toString()).toBe("https://provider.test/authorize");
    expect(oidcMocks.buildAuthorizationUrl).toHaveBeenCalledWith(
      { discovered: true },
      expect.objectContaining({
        redirect_uri: "https://api.example.test/api/auth/oauth/google/callback",
        state: "state",
        nonce: "expected-nonce",
        code_challenge: "calculated-challenge",
        code_challenge_method: "S256",
      }),
    );
  });

  it("uses the provider-verified Apple relay email and first-authorization name", async () => {
    const profile = await completeAuthorization(
      "apple",
      new URL("https://api.example.test/api/auth/oauth/apple/callback?code=auth-code&state=state"),
      { state: "state", nonce: "expected-nonce", codeVerifier: "verifier" },
      "First Last",
    );

    expect(profile).toMatchObject({
      subject: "stable-provider-subject",
      email: "private-relay@privaterelay.appleid.com",
      emailVerified: true,
      fullName: "First Last",
    });
    expect(oidcMocks.authorizationCodeGrant).toHaveBeenCalledWith(
      { discovered: true },
      expect.any(URL),
      expect.objectContaining({
        expectedState: "state",
        expectedNonce: "expected-nonce",
        pkceCodeVerifier: "verifier",
      }),
    );
  });

  it("rejects a provider identity token whose nonce does not match the OAuth transaction", async () => {
    oidcMocks.authorizationCodeGrant.mockResolvedValue({
      claims: () => ({ ...claims, nonce: "wrong-nonce" }),
    });

    await expect(completeAuthorization(
      "google",
      new URL("https://api.example.test/api/auth/oauth/google/callback?code=auth-code&state=state"),
      { state: "state", nonce: "expected-nonce", codeVerifier: "verifier" },
    )).rejects.toMatchObject({
      code: "OAUTH_INVALID_RESPONSE",
    });
  });

  it("propagates expired-token rejection from the OIDC verifier", async () => {
    oidcMocks.authorizationCodeGrant.mockRejectedValue(new Error("ID token expired"));

    await expect(completeAuthorization(
      "google",
      new URL("https://api.example.test/api/auth/oauth/google/callback?code=auth-code&state=state"),
      { state: "state", nonce: "expected-nonce", codeVerifier: "verifier" },
    )).rejects.toThrow("ID token expired");
  });
});
