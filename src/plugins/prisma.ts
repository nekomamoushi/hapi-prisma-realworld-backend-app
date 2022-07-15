import Hapi from "@hapi/hapi";
import { PrismaClient } from "@prisma/client";

// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33809#issuecomment-472103564
declare module "@hapi/hapi" {
  interface ServerApplicationState {
    prisma: PrismaClient;
  }
}

const prismaPlugin: Hapi.Plugin<null> = {
  name: "prisma",
  register: async function (server: Hapi.Server) {
    const prisma = new PrismaClient();

    server.app.prisma = prisma;

    // Close DB connection after the server's connection listeners are stopped
    server.ext({
      type: "onPostStop",
      method: async (server: Hapi.Server) => {
        server.app.prisma.$disconnect();
      },
    });
  },
};

export default prismaPlugin;
