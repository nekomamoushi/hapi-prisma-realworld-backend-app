import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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
        password: bcrypt.hashSync("passeword", 10),
      },
      {
        username: "jayee",
        email: "jayee@prisma.com",
        password: bcrypt.hashSync("passeword", 10),
      },
      {
        username: "naboo",
        email: "naboo@prisma.com",
        password: bcrypt.hashSync("passeword", 10),
      },
    ],
  });

  const user = await prisma.user.findUnique({
    where: {
      email: "germione@prisma.com",
    },
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
