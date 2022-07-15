import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.tag.deleteMany();

  const tag = await prisma.tag.create({
    data: {
      tag: "react",
    },
    select: {
      tag: true,
    },
  });

  console.log(`Tag created: ${tag.tag}`);

  const tags = await prisma.tag.createMany({
    data: [
      {
        tag: "angular",
      },
      { tag: "javascript" },
    ],
  });

  const tagCount = await prisma.tag.aggregate({
    _count: true,
  });
  console.log(`Tags count: ${tagCount._count}`);
}

main()
  .catch((e: Error) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
