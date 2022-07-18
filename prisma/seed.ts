import { PrismaClient } from "@prisma/client";
import prismaPlugin from "../src/plugins/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

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

  const users = await prisma.user.createMany({
    data: [
      {
        username: "germione",
        email: "germione@prisma.com",
        password: "passeword",
      },
      {
        username: "jayee",
        email: "jayee@prisma.com",
        password: "passeword",
      },
      {
        username: "nabo",
        email: "nabooo@prisma.com",
        password: "passeword",
      },
    ],
  });

  const userCount = await prisma.user.aggregate({
    _count: true,
  });
}

main()
  .catch((e: Error) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
