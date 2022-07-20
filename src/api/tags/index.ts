import Hapi from "@hapi/hapi";
import { routes } from "./routes";

const tagsPlugin: Hapi.Plugin<any> = {
  name: "tags",
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

export default tagsPlugin;
