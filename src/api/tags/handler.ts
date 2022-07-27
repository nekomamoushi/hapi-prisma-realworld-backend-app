import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";

export interface TagResponse {
  tags: string[];
}

async function getTags(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;

  try {
    const tags = await prisma.tag.findMany({ select: { tag: true } });
    const response: TagResponse = {
      tags: tags.map((t) => t.tag),
    };
    return h.response({ tags: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to get tags");
  }
}

export { getTags };
