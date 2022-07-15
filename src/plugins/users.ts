import Hapi from "@hapi/hapi";
import Joi from "joi";

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
  return h.response({ users: null }).code(200);
}

export default usersPlugin;
