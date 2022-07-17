import Hapi, { AuthCredentials } from "@hapi/hapi";
import Boom from "@hapi/boom";

const profilesPlugin: Hapi.Plugin<any> = {
  name: "profiles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    await server.route([
      {
        method: "GET",
        path: "/profiles/{username}",
        handler: getProfileHandler,
      },
      {
        method: "POST",
        path: "/profiles/{username}/follow",
        handler: followUserHandler,
        options: {
          auth: {
            strategy: "jwt",
          },
        },
      },
      {
        method: "DELETE",
        path: "/profiles/{username}/follow",
        handler: unfollowUserHandler,
        options: {
          auth: {
            strategy: "jwt",
          },
        },
      },
    ]);
  },
};

async function getProfileHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { username } = request.params;

  try {
    const profile = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!profile) {
      throw Boom.notFound(`coul not find user: ${username}`);
    }

    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        following: true,
      },
    });

    const following = me?.following.find((user) => user.id === profile.id);

    const response = {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following: Boolean(following),
    };
    return h.response({ profile: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to get profile");
  }
}

async function followUserHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { username } = request.params;

  try {
    const userToFollow = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!userToFollow) {
      throw Boom.notFound(`could not find user: ${username}`);
    }

    if (userToFollow.id === userId) {
      throw Boom.badRequest(`can not follow yourself`);
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        following: {
          connect: {
            id: userToFollow.id,
          },
        },
      },
    });

    const response = {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true,
    };

    return h.response({ profile: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation(`failed to follow: ${username}`);
  }
}

async function unfollowUserHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { username } = request.params;

  try {
    const userToFollow = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!userToFollow) {
      throw Boom.notFound(`could not find user: ${username}`);
    }

    if (userToFollow.id === userId) {
      throw Boom.badRequest(`can not follow yourself`);
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        following: {
          disconnect: {
            id: userToFollow.id,
          },
        },
      },
    });

    const response = {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: false,
    };

    return h.response({ profile: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation(`failed to unfollow: ${username}`);
  }
}

export default profilesPlugin;
