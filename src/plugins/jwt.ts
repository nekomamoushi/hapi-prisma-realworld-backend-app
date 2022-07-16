import Hapi from "@hapi/hapi";
import Boom from "@hapi/boom";
import { validateAPIToken } from "../helpers/jwt";

export const API_AUTH_STATEGY = "jwt";

export const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_JWT_SECRET";
export const JWT_ALGORITHM = "HS256";
export const JWT_TOKEN_EXPIRATION_HOURS = 1;

const customErrorFunc = (e: any) => {
  throw Boom.unauthorized("token is not valid");
};

const jwtPlugin: Hapi.Plugin<null> = {
  name: "jwt",
  dependencies: ["hapi-auth-jwt2"],
  register: async function (server: Hapi.Server) {
    server.auth.strategy(API_AUTH_STATEGY, "jwt", {
      key: JWT_SECRET,
      verifyOptions: { algorithms: [JWT_ALGORITHM] },
      validate: validateAPIToken,
      tokenType: "Token",
      errorFunc: customErrorFunc,
    });

    server.auth.default(API_AUTH_STATEGY);
  },
};

export default jwtPlugin;
