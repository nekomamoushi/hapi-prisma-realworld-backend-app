import Hapi from "@hapi/hapi";
import hapiAuthJwt2 from "hapi-auth-jwt2";
import jwtPlugin from "./plugins/jwt";
import prismaPlugin from "./plugins/prisma";
import statusPlugin from "./plugins/status";
import tagsPlugin from "./plugins/tags";
import usersPlugin from "./plugins/users";

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
});

const plugins: Hapi.Plugin<any>[] = [
  hapiAuthJwt2,
  statusPlugin,
  prismaPlugin,
  jwtPlugin,
  usersPlugin,
  tagsPlugin,
];

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
