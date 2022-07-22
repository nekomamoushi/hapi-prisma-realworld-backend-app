import Hapi from "@hapi/hapi";
import Glue from "@hapi/glue";
import Manifest from "../config/manifest";

const options = {
  relativeTo: __dirname,
};

export async function createServer(): Promise<Hapi.Server> {
  const server = await Glue.compose(Manifest, options);
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
