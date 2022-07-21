import Hapi, { ServerRoute } from "@hapi/hapi";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/",
    handler: (_, h: Hapi.ResponseToolkit) => {
      return h.response({ up: true }).code(200);
    },
    options: {
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
