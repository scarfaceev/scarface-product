import type { PrismaClient, ProductStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import { ProductRepository } from "./product.repository.js";
import type { productWriteSchema } from "./product.schemas.js";
import type { z } from "zod";

type ProductWriteInput = z.infer<typeof productWriteSchema>;

export class ProductService {
  private readonly repository: ProductRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new ProductRepository(prisma);
  }

  async listPublished(category: string | undefined, page: number, pageSize: number) {
    const [items, total] = await this.repository.listPublished(category, page, pageSize);
    return {
      items: items.map((item) => this.serialize(item)),
      pagination: { page, pageSize, total },
    };
  }

  async getPublishedById(id: string) {
    const product = await this.repository.getPublishedById(id);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "The requested product was not found.");
    return this.serialize(product);
  }

  async createForAdmin(input: ProductWriteInput, status: ProductStatus = "DRAFT") {
    return this.prisma.product.create({
      data: {
        ...input,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
  }

  async updateForAdmin(id: string, input: Partial<ProductWriteInput>) {
    return this.prisma.product.update({ where: { id }, data: input });
  }

  async setStatusForAdmin(id: string, status: ProductStatus) {
    return this.prisma.product.update({
      where: { id },
      data: { status, publishedAt: status === "PUBLISHED" ? new Date() : null },
    });
  }

  private serialize(product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    features: unknown;
    specifications: unknown;
    publishedAt: Date | null;
  }) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      features: product.features,
      specifications: product.specifications,
      publishedAt: product.publishedAt,
    };
  }
}
