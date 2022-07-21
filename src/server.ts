import Hapi from "@hapi/hapi";
import hapiAuthJwt2 from "hapi-auth-jwt2";

import jwtPlugin from "./plugins/jwt";
import prismaPlugin from "./plugins/prisma";

import statusPlugin from "./api/status";
import usersPlugin from "./api/users";
import profilesPlugin from "./api/profiles";
import articlesPlugin from "./api/articles";
import tagsPlugin from "./api/tags";

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3001,
  host: process.env.HOST || "localhost",
  routes: {
    cors: {
      origin: ["http://localhost:4200"], // an array of origins or 'ignore'
    },
  },
});

const plugins: Hapi.Plugin<any>[] = [
  hapiAuthJwt2,
  statusPlugin,
  prismaPlugin,
  jwtPlugin,
  usersPlugin,
  tagsPlugin,
  profilesPlugin,
  articlesPlugin,
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
