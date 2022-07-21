import Hapi, { AuthCredentials } from "@hapi/hapi";
import Boom from "@hapi/boom";
import bcrypt from "bcrypt";
import { generateJwtToken } from "../../helpers/jwt";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    userId: number;
  }
}

interface UserPayload {
  user: {
    email: string;
    username: string;
    password: string;
    bio: string;
    image: string;
    token?: string;
  };
}

async function registerUser(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const {
    user: { email, username, password },
  } = request.payload as UserPayload;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      throw Boom.badRequest("user already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    const token = generateJwtToken(createdUser.id);

    const response = {
      email: createdUser.email,
      username: createdUser.username,
      bio: createdUser.bio,
      image: createdUser.image,
      token,
    };
    return h.response({ users: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to register user");
  }
}

async function loginUser(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const {
    user: { email, password },
  } = request.payload as UserPayload;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw Boom.badRequest("user does not exists");
    }

    const validPassword = await bcrypt.compare(password, user?.password);
    if (!validPassword) {
      throw Boom.badRequest("password is not valid");
    }

    const token = generateJwtToken(user.id);

    const response = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
      token,
    };
    return h.response({ user: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to login user");
  }
}

async function getCurrentUser(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw Boom.badImplementation("could not find user");
    }

    const response = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };

    return h.response({ user: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to get current user");
  }
}

async function updateCurrentUser(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { user: userPayload } = request.payload as Partial<UserPayload>;

  try {
    let user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw Boom.notFound("could not found user");
    }

    let data = {
      email: userPayload?.email,
      username: userPayload?.username,
      bio: userPayload?.bio,
      image: userPayload?.image,
    };

    user = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });

    const response = {
      email: user.email,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
    return h.response({ user: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to update current user");
  }
}

export { registerUser, loginUser, getCurrentUser, updateCurrentUser };
