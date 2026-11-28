import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { OAuthProfile, OAuthProvider } from "./oauth.providers.js";
import { getProviderEnum } from "./oauth.providers.js";

const emailSchema = z.string().email().max(254);

function normalizedEmail(profile: OAuthProfile): string | null {
  if (!profile.email || !profile.emailVerified) return null;
  const parsed = emailSchema.safeParse(profile.email.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

function normalizedName(profile: OAuthProfile): string {
  const name = profile.fullName?.trim().replace(/\s+/g, " ").slice(0, 120);
  return name && name.length >= 2 ? name : "Scarface EV user";
}

export async function resolveOAuthUser(
  provider: OAuthProvider,
  profile: OAuthProfile,
  options: { linkToUserId?: string } = {},
) {
  const providerValue = getProviderEnum(provider);
  const email = normalizedEmail(profile);
  const existingIdentity = await prisma.oAuthIdentity.findUnique({
    where: { provider_providerAccountId: { provider: providerValue, providerAccountId: profile.subject } },
    include: { user: true },
  });
  if (existingIdentity) {
    if (options.linkToUserId && existingIdentity.userId !== options.linkToUserId) {
      throw new AppError(409, "OAUTH_IDENTITY_ALREADY_LINKED", "This provider account is already linked to another user.");
    }
    await prisma.oAuthIdentity.update({
      where: { id: existingIdentity.id },
      data: {
        providerEmail: profile.email?.slice(0, 254) ?? null,
        providerEmailVerified: profile.emailVerified,
        providerName: profile.fullName?.slice(0, 120) ?? null,
        avatarUrl: profile.avatarUrl,
      },
    });
    return existingIdentity.user;
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      let user;
      if (options.linkToUserId) {
        user = await transaction.user.findUnique({ where: { id: options.linkToUserId } });
        if (!user) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
      } else {
        user = email ? await transaction.user.findUnique({ where: { email } }) : null;
        if (user) {
          throw new AppError(409, "OAUTH_ACCOUNT_LINK_REQUIRED", "Sign in to your existing account before linking this provider.");
        }
      }
      if (!user) {
        user = await transaction.user.create({
          data: {
            fullName: normalizedName(profile),
            email,
            emailVerifiedAt: email ? new Date() : null,
            passwordHash: null,
          },
        });
      }

      await transaction.oAuthIdentity.create({
        data: {
          userId: user.id,
          provider: providerValue,
          providerAccountId: profile.subject,
          providerEmail: profile.email?.slice(0, 254) ?? null,
          providerEmailVerified: profile.emailVerified,
          providerName: profile.fullName?.slice(0, 120) ?? null,
          avatarUrl: profile.avatarUrl,
        },
      });
      return user;
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;

    const identity = await prisma.oAuthIdentity.findUnique({
      where: { provider_providerAccountId: { provider: providerValue, providerAccountId: profile.subject } },
      include: { user: true },
    });
    if (identity) {
      if (options.linkToUserId && identity.userId !== options.linkToUserId) {
        throw new AppError(409, "OAUTH_IDENTITY_ALREADY_LINKED", "This provider account is already linked to another user.");
      }
      return identity.user;
    }
    throw new AppError(409, "OAUTH_ACCOUNT_CONFLICT", "This identity could not be linked safely. Please try again.");
  }
}
