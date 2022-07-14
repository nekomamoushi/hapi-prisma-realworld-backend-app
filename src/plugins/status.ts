import Hapi from "@hapi/hapi";

// plugin to instantiate Prisma Client
const statusPlugin: Hapi.Plugin<undefined> = {
  name: "status",
  register: async function (server: Hapi.Server) {
    server.route({
      method: "GET",
      path: "/",
      handler: (_, h: Hapi.ResponseToolkit) => {
        return h.response({ up: true }).code(200);
      },
    });
  },
};

export default statusPlugin;
