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
      description: "Get Single Articles",
      notes: "Returns a Article Object",
      tags: ["api", "Articles"],
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
      description: "Get All Articles",
      notes: "Returns a array of Article",
      tags: ["api", "Articles"],
      auth: false,
    },
  },
  {
    method: "GET",
    path: "/api/articles/feed",
    handler: getFeed,
    options: {
      description: "Get All Articles",
      notes: "Returns a array of Article",
      tags: ["api", "Articles"],
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
      description: "Create an Article",
      notes: "Returns an Article Object",
      tags: ["api", "Articles"],
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
      description: "Update an Article",
      notes: "Returns an Article Object",
      tags: ["api", "Articles"],
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
      description: "Delete an Article",
      notes: "Returns an Article Object",
      tags: ["api", "Articles"],
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
      description: "Favorite an Article",
      notes: "Returns an Article Object",
      tags: ["api", "Articles"],
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
      description: "Unfavorite an Article",
      notes: "Returns an Article Object",
      tags: ["api", "Articles"],
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
      description: "Create a Comment for an Article",
      notes: "Returns an Comment Object",
      tags: ["api", "Articles"],
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
      description: "Get All Comments from an Articles",
      notes: "Returns an array of Comments",
      tags: ["api", "Articles"],
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
      description: "Delete a Comment for an Article",
      notes: "Returns an Comment Object",
      tags: ["api", "Articles"],
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
];

export { routes };
