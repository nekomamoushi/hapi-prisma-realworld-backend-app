import Hapi from "@hapi/hapi";
import { routes } from "./routes";

const profilesPlugin: Hapi.Plugin<any> = {
  name: "profiles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    await server.route(routes);
  },
};

export default profilesPlugin;
