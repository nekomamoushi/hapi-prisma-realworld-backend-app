import Hapi, { AuthCredentials, ServerRoute } from "@hapi/hapi";
import { routes } from "./routes";

const usersPlugin: Hapi.Plugin<any> = {
  name: "users",
  dependencies: ["prisma", "hapi-auth-jwt2"],
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

export default usersPlugin;
