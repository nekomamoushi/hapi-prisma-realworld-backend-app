import Hapi, { ResponseObject } from "@hapi/hapi";
import Glue from "@hapi/glue";
import Manifest from "../config/manifest";
import Dotenv from "dotenv";

Dotenv.config({ path: `${__dirname}/../.env` });

const options = {
  relativeTo: __dirname,
};

export async function createServer(): Promise<Hapi.Server> {
  const server = await Glue.compose(Manifest, options);
  if (process.env.NODE_ENV !== "test") {
    server.events.on("response", function (request: Hapi.Request) {
      const response = request.response as ResponseObject;
      console.log(
        request.info.remoteAddress +
          ": " +
          request.method.toUpperCase().padEnd(7, " ") +
          " " +
          response.statusCode +
          " --> " +
          request.path
      );
    });
  }
  await server.start();
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
