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
    path: "/api/users",
    handler: registerUser,
    options: {
      description: "Create a User",
      notes: "Returns a User Object",
      tags: ["api", "Users"],
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
    path: "/api/users/login",
    handler: loginUser,
    options: {
      description: "Log In a User",
      notes: "Returns a User Object",
      tags: ["api", "Users"],
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
    path: "/api/user",
    handler: getCurrentUser,
    options: {
      description: "Get User Information",
      notes: "Returns a User Object",
      tags: ["api", "Users"],
      auth: {
        strategy: "jwt",
      },
    },
  },
  {
    method: "PUT",
    path: "/api/user",
    handler: updateCurrentUser,
    options: {
      description: "Update User Information",
      notes: "Returns a User Object",
      tags: ["api", "Users"],
      auth: {
        strategy: "jwt",
      },
    },
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
