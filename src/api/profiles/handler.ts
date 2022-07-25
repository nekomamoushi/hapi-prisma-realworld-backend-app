import Hapi, { AuthCredentials } from "@hapi/hapi";
import Boom from "@hapi/boom";

export interface ProfileResponse {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

async function getProfile(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { username } = request.params;
  const credentials = request.auth.credentials as AuthCredentials;
  let userId;

  if (credentials) {
    userId = credentials.userId;
  }

  try {
    const profile = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!profile) {
      throw Boom.notFound(`coul not find user: ${username}`);
    }

    const response = {
      username: profile.username,
      bio: profile.bio,
      image: profile.image,
      following: false,
    };

    if (!userId) {
      // no authentication
      return h.response({ profile: response }).code(200);
    }

    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        following: true,
      },
    });

    const following = me?.following.find((user) => user.id === profile.id);
    response["following"] = Boolean(following);

    return h.response({ profile: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to get profile");
  }
}

async function followUser(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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

async function unfollowUser(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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

export { getProfile, followUser, unfollowUser };
