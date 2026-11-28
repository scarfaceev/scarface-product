import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  oAuthIdentity: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../src/database/prisma.js", () => ({ prisma: database }));

import { resolveOAuthUser } from "../src/modules/auth/oauth.accounts.js";
import { AppError } from "../src/utils/app-error.js";

const user = {
  id: "c6204c65-eec4-4fd8-9dd4-2feb8fb44885",
  fullName: "Google User",
  email: "person@gmail.com",
  emailVerifiedAt: new Date(),
  phone: null,
  passwordHash: null,
};
const profile = {
  subject: "provider-stable-subject",
  email: "person@gmail.com",
  emailVerified: true,
  fullName: "Google User",
  avatarUrl: null,
};

describe("OAuth account resolution", () => {
  const transaction = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    oAuthIdentity: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    database.oAuthIdentity.findUnique.mockResolvedValue(null);
    database.$transaction.mockImplementation(async (callback) => callback(transaction));
    transaction.user.findUnique.mockResolvedValue(null);
    transaction.user.create.mockResolvedValue(user);
    transaction.oAuthIdentity.create.mockResolvedValue({});
  });

  it("creates a new provider user and identity without phone or password", async () => {
    const result = await resolveOAuthUser("google", profile);

    expect(result).toBe(user);
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Google User",
        email: "person@gmail.com",
        emailVerifiedAt: expect.any(Date),
        passwordHash: null,
      },
    });
    expect(transaction.oAuthIdentity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        provider: "GOOGLE",
        providerAccountId: "provider-stable-subject",
      }),
    });
  });

  it("authenticates an already-linked provider identity", async () => {
    database.oAuthIdentity.findUnique.mockResolvedValue({
      id: "identity-id",
      userId: user.id,
      user,
    });
    database.oAuthIdentity.update.mockResolvedValue({});

    const result = await resolveOAuthUser("google", profile);

    expect(result).toBe(user);
    expect(database.oAuthIdentity.update).toHaveBeenCalledOnce();
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("does not automatically link an identity by matching an existing email", async () => {
    transaction.user.findUnique.mockResolvedValue(user);

    await expect(resolveOAuthUser("google", profile)).rejects.toMatchObject({
      code: "OAUTH_ACCOUNT_LINK_REQUIRED",
      statusCode: 409,
    });
    expect(transaction.user.create).not.toHaveBeenCalled();
    expect(transaction.oAuthIdentity.create).not.toHaveBeenCalled();
  });

  it("links a new provider identity only to the explicitly authenticated user", async () => {
    transaction.user.findUnique.mockResolvedValue(user);

    const result = await resolveOAuthUser("apple", { ...profile, subject: "apple-subject" }, {
      linkToUserId: user.id,
    });

    expect(result).toBe(user);
    expect(transaction.user.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
    expect(transaction.user.create).not.toHaveBeenCalled();
    expect(transaction.oAuthIdentity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: user.id, provider: "APPLE", providerAccountId: "apple-subject" }),
    });
  });

  it("refuses to link a provider identity already owned by another user", async () => {
    database.oAuthIdentity.findUnique.mockResolvedValue({
      id: "identity-id",
      userId: "different-user-id",
      user: { ...user, id: "different-user-id" },
    });

    await expect(resolveOAuthUser("apple", profile, { linkToUserId: user.id }))
      .rejects.toBeInstanceOf(AppError);
    expect(database.oAuthIdentity.update).not.toHaveBeenCalled();
  });
});
