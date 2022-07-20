import { ServerRoute } from "@hapi/hapi";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
} from "./handler";
import { loginUserValidator, registerUserValidator } from "./validator";

const routes: ServerRoute[] = [
  {
    method: "POST",
    path: "/users",
    handler: registerUser,
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
    handler: loginUser,
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

export { routes };
