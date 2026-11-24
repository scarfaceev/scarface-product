import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  await prisma.product.upsert({
    where: { slug: "scarfaceev-tall-charger" },
    update: {},
    create: {
      slug: "scarfaceev-tall-charger",
      name: "ScarfaceEV Tall Charger",
      category: "Tall charger",
      description: "A premium charger designed for simple, dependable everyday charging. Product description to be supplied.",
      features: [
        "Key advantage one – to be confirmed",
        "Key advantage two – to be confirmed",
        "Key advantage three – to be confirmed",
      ],
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

seed()
  .catch((error: unknown) => {
    console.error("Product seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
