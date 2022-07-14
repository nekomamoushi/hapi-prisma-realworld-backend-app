import Hapi from "@hapi/hapi";

const tagsPlugin: Hapi.Plugin<any> = {
  name: "tags",
  register: async function (server: Hapi.Server) {
    server.route({
      method: "GET",
      path: "/tags",
      handler: (_, h: Hapi.ResponseToolkit) =>
        h.response({ tags: [] }).code(200),
    });
  },
};

export default tagsPlugin;
