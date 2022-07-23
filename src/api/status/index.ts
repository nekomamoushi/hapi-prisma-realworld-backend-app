import Hapi, { ServerRoute } from "@hapi/hapi";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/",
    handler: (_, h: Hapi.ResponseToolkit) => {
      return h.response({ up: true }).code(200);
    },
    options: {
      description: "Get Server Status",
      notes: "Returns an object with the server status",
      tags: ["api", "Status"],
      auth: false,
    },
  },
];

const statusPlugin: Hapi.Plugin<undefined> = {
  name: "status",
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

export default statusPlugin;
