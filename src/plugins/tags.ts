import Hapi, { ServerRoute } from "@hapi/hapi";
import Boom from "@hapi/boom";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/tags",
    handler: getTagsHandler,
    options: {
      auth: false,
    },
  },
];

const tagsPlugin: Hapi.Plugin<any> = {
  name: "tags",
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

async function getTagsHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;

  try {
    const tags = await prisma.tag.findMany({ select: { tag: true } });
    const response = tags.map((t) => t.tag);
    return h.response({ tags: response }).code(200);
  } catch (err: any) {
    console.error(err.message);
    return Boom.badImplementation("failed to get tags");
  }
}

export default tagsPlugin;
