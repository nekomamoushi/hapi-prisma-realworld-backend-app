import Hapi, { Auth, AuthCredentials, ServerRoute } from "@hapi/hapi";
import { routes } from "./routes";

const articlesPlugin: Hapi.Plugin<any> = {
  name: "articles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

export default articlesPlugin;
