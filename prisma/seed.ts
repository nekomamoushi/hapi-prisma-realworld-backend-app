import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.tag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$queryRaw`ALTER SEQUENCE "Tag_id_seq" RESTART WITH 1`;
  await prisma.$queryRaw`ALTER SEQUENCE "Comment_id_seq" RESTART WITH 1`;
  await prisma.$queryRaw`ALTER SEQUENCE "Article_id_seq" RESTART WITH 1`;
  await prisma.$queryRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;

  const user1 = await prisma.user.create({
    data: {
      username: "germione",
      email: "germione@prisma.com",
      password: bcrypt.hashSync("passeword", 10),
      articles: {
        createMany: {
          data: [
            {
              title: "How to defy your cat",
              slug: "How-to-defy-your-cat",
              description: "Hard right?",
              body: "meow strongly",
              tagList: ["animal", "defy", "cats"],
            },
            {
              title: "How to eat a fish",
              slug: "How-to-eat-a-fish",
              description: "Easy Peasy",
              body: "open your mouth strongly",
              tagList: ["animal", "eat", "fish"],
            },
          ],
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "jayee",
      email: "jayee@prisma.com",
      password: bcrypt.hashSync("passeword", 10),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: "naboo",
      email: "naboo@prisma.com",
      password: bcrypt.hashSync("passeword", 10),
      articles: {
        createMany: {
          data: [
            {
              title: "How Angular Standalone components works",
              slug: "How-angular-standalone-components-works",
              description: "Simplify angular development",
              body: "We don't use NgModules anymore",
              tagList: ["angular", "modules", "standalone", "components"],
            },
          ],
        },
      },
    },
  });

  const userCount = await prisma.user.aggregate({
    _count: true,
  });
  console.log(`${userCount._count} users created:`);
  console.log(`  - ${user1.username}`);
  console.log(`  - ${user2.username}`);
  console.log(`  - ${user3.username}`);
}

main()
  .catch((e: Error) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
