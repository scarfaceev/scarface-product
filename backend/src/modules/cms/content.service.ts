import type { ContentStatus, Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import type { ContentPageWriteInput } from "./content.schemas.js";

export class ContentService {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublished(page: number, pageSize: number) {
    const where = { status: "PUBLISHED" as const };
    const [items, total] = await Promise.all([
      this.prisma.contentPage.findMany({
        where,
        select: { slug: true, title: true, seoTitle: true, seoDescription: true, publishedAt: true },
        orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contentPage.count({ where }),
    ]);
    return { items, pagination: { page, pageSize, total } };
  }

  async getPublishedBySlug(slug: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
    if (!page) throw new AppError(404, "CONTENT_NOT_FOUND", "The requested page was not found.");
    return page;
  }

  async upsertForAdmin(input: ContentPageWriteInput, status: ContentStatus = "DRAFT") {
    return this.prisma.$transaction(async (transaction) => {
      const page = await transaction.contentPage.upsert({
        where: { slug: input.slug },
        create: {
          slug: input.slug,
          title: input.title,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
        update: {
          title: input.title,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
      await transaction.contentSection.deleteMany({ where: { pageId: page.id } });
      if (input.sections.length > 0) {
        await transaction.contentSection.createMany({
          data: input.sections.map((section) => ({
            ...section,
            pageId: page.id,
            content: section.content as Prisma.InputJsonValue,
          })),
        });
      }
      return transaction.contentPage.findUniqueOrThrow({
        where: { id: page.id },
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      });
    });
  }
}
