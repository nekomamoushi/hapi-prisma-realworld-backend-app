import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";
import Joi from "joi";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_JWT_SECRET";
const JWT_ALGORITHM = "HS256";
const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 1;

interface UserPayload {
  user: {
    email: string;
    username: string;
    password: string;
  };
}

const userPayloadValidator = Joi.object({
  user: Joi.object({
    email: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
});

const usersPlugin: Hapi.Plugin<any> = {
  name: "users",
  register: async function (server: Hapi.Server) {
    server.route({
      method: "POST",
      path: "/users",
      handler: registerUserHandler,
      options: {
        validate: {
          payload: userPayloadValidator,
          failAction: (request, h, err) => {
            // show validation errors to user
            // https://github.com/hapijs/hapi/issues/3706
            throw err;
          },
        },
      },
    });
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

// Generate a signed JWT token with the tokenId in the payload
function generateJwtToken(tokenId: number): string {
  const jwtPayload = { tokenId };
  const signInOptions: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
    noTimestamp: true,
  };
  return jwt.sign(jwtPayload, JWT_SECRET, signInOptions);
}

export default usersPlugin;
