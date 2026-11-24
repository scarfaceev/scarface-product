import type { PrismaClient, ProductStatus } from "@prisma/client";

export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listPublished(category: string | undefined, page: number, pageSize: number) {
    const where = { status: "PUBLISHED" as ProductStatus, ...(category ? { category } : {}) };
    return Promise.all([
      this.prisma.product.findMany({
        where,
        include: { media: { include: { mediaAsset: true }, orderBy: { position: "asc" } }, datasheetMedia: true },
        orderBy: [{ publishedAt: "desc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  getPublishedById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, status: "PUBLISHED" },
      include: { media: { include: { mediaAsset: true }, orderBy: { position: "asc" } }, datasheetMedia: true },
    });
  }

  getBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }
}
