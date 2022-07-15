import Hapi from "@hapi/hapi";
import prismaPlugin from "./plugins/prisma";
import statusPlugin from "./plugins/status";
import tagsPlugin from "./plugins/tags";

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
});

const plugins: Hapi.Plugin<any>[] = [statusPlugin, prismaPlugin, tagsPlugin];

export async function createServer(): Promise<Hapi.Server> {
  await server.register(plugins);
  await server.initialize();
  return server;
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
  await server.start();
  console.log(`Server running on ${server.info.uri}`);
  return server;
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});
