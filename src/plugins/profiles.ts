import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";

const profilesPlugin: Hapi.Plugin<any> = {
  name: "profiles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    await server.route({
      method: "GET",
      path: "/profiles/{username}",
      handler: getProfileHandler,
    });
  },
};

async function getProfileHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { username } = request.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw Boom.notFound(`coul not find user: ${username}`);
    }
    const response = {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: false,
    };
    return h.response({ profiles: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to get profile");
  }
}

export default profilesPlugin;
