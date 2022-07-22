import { ServerRoute } from "@hapi/hapi";
import { API_AUTH_STATEGY } from "../../plugins/jwt";
import {
  addCommentToArticle,
  createArticle,
  deleteArticle,
  deleteCommentToArticle,
  favoriteArticle,
  getAllArticle,
  getCommentsToArticle,
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
    path: "/api/articles/{slug}",
    handler: getSingleArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
        mode: "try",
      },
    },
  },
  {
    method: "GET",
    path: "/api/articles",
    handler: getAllArticle,
    options: {
      auth: false,
    },
  },
  {
    method: "GET",
    path: "/api/articles/feed",
    handler: getFeed,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/api/articles",
    handler: createArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
      validate: {
        payload: createArticleValidator,
        failAction: (request, h, err: any) => {
          err = formatValidationErrors(err);
          throw err;
        },
      },
    },
  },
  {
    method: "PUT",
    path: "/api/articles/{slug}",
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
    path: "/api/articles/{slug}",
    handler: deleteArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/api/articles/{slug}/favorite",
    handler: favoriteArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "DELETE",
    path: "/api/articles/{slug}/favorite",
    handler: unfavoriteArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/api/articles/{slug}/comments",
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
  {
    method: "GET",
    path: "/api/articles/{slug}/comments",
    handler: getCommentsToArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
        mode: "try",
      },
    },
  },
  {
    method: "DELETE",
    path: "/api/articles/{slug}/comments/{id}",
    handler: deleteCommentToArticle,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
];

export { routes };
