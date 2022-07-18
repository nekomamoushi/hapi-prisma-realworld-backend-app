import Hapi, {
  AuthCredentials,
  ServerRoute,
  UserCredentials,
} from "@hapi/hapi";
import Boom from "@hapi/boom";
import Joi from "joi";
import bcrypt from "bcrypt";
import { generateJwtToken } from "../helpers/jwt";

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
  };
}

const userPayloadValidator = Joi.object({
  user: Joi.object({
    email: Joi.string().alter({
      register: (schema) =>
        schema.required().error((errors) => new Error(`email can't be blank`)),
      login: (schema) => schema.required(),
    }),
    username: Joi.string().alter({
      register: (schema) =>
        schema
          .required()
          .error((errors) => new Error(`username can't be blank`)),
      login: (schema) => schema.optional(),
    }),
    password: Joi.string().alter({
      register: (schema) =>
        schema
          .required()
          .error((errors) => new Error(`password can't be blank`)),
      login: (schema) => schema.required(),
    }),
    bio: Joi.string().optional(),
    image: Joi.string().optional(),
  }),
});

const registerUserValidator = userPayloadValidator.tailor("register");
const loginUserValidator = userPayloadValidator.tailor("login");

const routes: ServerRoute[] = [
  {
    method: "POST",
    path: "/users",
    handler: registerUserHandler,
    options: {
      auth: false,
      validate: {
        payload: registerUserValidator,
        failAction: (request, h, err: any) => {
          // show validation errors to user
          // https://github.com/hapijs/hapi/issues/3706
          err = formatValidationErrors(err);
          throw err;
        },
      },
    },
  },
  {
    method: "POST",
    path: "/users/login",
    handler: loginUserHandler,
    options: {
      auth: false,
      validate: {
        payload: loginUserValidator,
        failAction: (request, h, err: any) => {
          err = formatValidationErrors(err);
          throw err;
        },
      },
    },
  },
  {
    method: "GET",
    path: "/user",
    handler: getCurrentUser,
    options: {
      auth: {
        strategy: "jwt",
      },
    },
  },
  {
    method: "PUT",
    path: "/user",
    handler: updateCurrentUser,
  },
];

const usersPlugin: Hapi.Plugin<any> = {
  name: "users",
  dependencies: ["prisma", "hapi-auth-jwt2"],
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

async function registerUserHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
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

async function loginUserHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
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

    let updatedUser = { ...user };
    Object.assign(updatedUser, userPayload);
    user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updatedUser,
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
    return Boom.badImplementation("failed to update current user");
  }
}

function formatValidationErrors(err: any) {
  const [key, ...message] = err.message.split(" ");
  err.output.statusCode = 422;
  err.output.payload = {
    errors: {
      [key]: [message.join(" ")],
    },
  };
  return err;
}

export default usersPlugin;
