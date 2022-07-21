import { ServerRoute } from "@hapi/hapi";
import { API_AUTH_STATEGY } from "../../plugins/jwt";
import {
  addCommentToArticle,
  createArticle,
  deleteArticle,
  favoriteArticle,
  getAllArticle,
  getFeed,
  getSingleArticle,
  unfavoriteArticle,
  updateArticle,
} from "./handler";
import {
  commentPayloadValidator,
  createArticleValidator,
  updateArticleValidator,
} from "./validator";

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

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/articles/{slug}",
    handler: getSingleArticle,
  },
  {
    method: "GET",
    path: "/articles",
    handler: getAllArticle,
  },
  {
    method: "GET",
    path: "/articles/feed",
    handler: getFeed,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/articles",
    handler: createArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
      validate: {
        payload: createArticleValidator,
        failAction: (request, h, err: any) => {
          console.log(err);
          err = formatValidationErrors(err);
          throw err;
        },
      },
    },
  },
  {
    method: "PUT",
    path: "/articles/{slug}",
    handler: updateArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
      validate: {
        payload: updateArticleValidator,
        failAction: (request, h, err: any) => {
          err = formatValidationErrors(err);
          throw err;
        },
      },
    },
  },
  {
    method: "DELETE",
    path: "/articles/{slug}",
    handler: deleteArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/articles/{slug}/favorite",
    handler: favoriteArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "DELETE",
    path: "/articles/{slug}/favorite",
    handler: unfavoriteArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/articles/{slug}/comments",
    handler: addCommentToArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
      validate: {
        payload: commentPayloadValidator,
        failAction: (request, h, err: any) => {
          err = formatValidationErrors(err);
          throw err;
        },
      },
    },
  },
];

export { routes };
