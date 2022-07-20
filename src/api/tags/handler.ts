import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";

async function getTags(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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

export { getTags };
