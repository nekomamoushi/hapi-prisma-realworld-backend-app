import Hapi, { Auth, AuthCredentials, ServerRoute } from "@hapi/hapi";
import Boom from "@hapi/boom";
import Joi from "joi";
import slugify from "slugify";
import { Article, Prisma } from "@prisma/client";
import { API_AUTH_STATEGY } from "../helpers/jwt";
import { HeapCodeStatistics } from "v8";
import { userInfo } from "os";

interface ArticlePayload {
  article: {
    title: string;
    description: string;
    body: string;
    tagList: string[];
  };
}

const articlePayloadValidator = Joi.object({
  article: Joi.object({
    title: Joi.string().alter({
      create: (schema) => schema.required(),
      update: (schema) => schema.optional(),
    }),
    description: Joi.string().alter({
      create: (schema) => schema.required(),
      update: (schema) => schema.optional(),
    }),
    body: Joi.string().alter({
      create: (schema) => schema.required(),
      update: (schema) => schema.optional(),
    }),
    tagList: Joi.array().optional(),
  }),
});

const createArticleValidator = articlePayloadValidator.tailor("create");
const updateArticleValidator = articlePayloadValidator.tailor("update");

async function getArticleHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;

  try {
    const article = await prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            following: true,
          },
        },
        favoritedBy: true,
      },
    });

    if (!article) {
      throw Boom.notFound("could not find article");
    }

    const response = formatArticle(article, userId);

    return h.response({ article: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to get article");
  }
}

async function getAllArticleHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.params;
  const { limit, offset, author, tag } = request.query;

  const take = limit ? +limit : 0;
  const skip = offset ? +offset : 0;

  const query: any = {
    include: {
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          following: true,
        },
      },
      favoritedBy: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  };

  if (author || tag) {
    query["where"] = {
      AND: [],
    };
  }

  if (author) {
    query["where"]["AND"].push({
      author: {
        username: {
          equals: author,
        },
      },
    });
  }

  if (tag) {
    query["where"]["AND"].push({
      tagList: {
        has: tag,
      },
    });
  }

  if (take) {
    query["take"] = take;
  }

  if (skip) {
    query["skip"] = skip;
  }

  const articles = await prisma.article.findMany(query);

  const response = articles.map((article) => {
    return formatArticle(article, userId);
  });

  try {
    return h
      .response({ articles: response, articlesCount: response.length })
      .code(200);
  } catch (err: any) {
    console.log(err);
    request.log("error", err);
    return Boom.badImplementation("failed to get all article");
  }
}

async function getFeedHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { limit, offset } = request.query;

  const take = limit ? +limit : undefined;
  const skip = offset ? +offset : undefined;

  try {
    let articles = await prisma.article.findMany({
      take,
      skip,
      where: {
        author: {
          follower: {
            some: {
              id: userId,
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            following: true,
          },
        },
      },
    });

    const response = articles.map((article) => {
      return formatArticle(article, userId);
    });

    return h
      .response({ articles: response, articlesCount: articles.length })
      .code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to get feed");
  }
}

async function createArticleHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const {
    article: { title, description, body, tagList },
  } = request.payload as ArticlePayload;

  try {
    const article = await prisma.article.create({
      data: {
        title,
        slug: slugify(title),
        description,
        body,
        tagList,
        author: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        author: {
          select: {
            email: true,
            username: true,
            bio: true,
            image: true,
          },
        },
        favoritedBy: true,
      },
    });

    const response = formatArticle(article, userId);
    return h.response({ article: response }).code(201);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to update current user");
  }
}

async function updateArticleHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    const { prisma } = request.server.app;
    const { userId } = request.auth.credentials as AuthCredentials;
    const { slug } = request.params;
    const {
      article: { title, description, body, tagList },
    } = request.payload as ArticlePayload;
    let updatedSlug;

    const article = await prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        author: true,
      },
    });

    if (!article) {
      throw Boom.notFound("could not find article");
    }

    if (userId !== article.author.id) {
      Boom.forbidden("You can't update this article");
    }

    if (title && title !== article.title) {
      updatedSlug = slugify(title);
    }

    const data: Prisma.ArticleUpdateInput = {
      title: title || article.title,
      slug: title ? updatedSlug : article.slug,
      description: description || article.description,
      body: body || article.body,
      tagList: tagList || article.tagList,
    };

    const updatedArticle = await prisma.article.update({
      where: {
        slug,
      },
      data,
      include: {
        author: true,
      },
    });

    const response = formatArticle(updatedArticle, userId);
    return h.response({ article: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to update article");
  }
}

async function deleteArticleHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;

  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
    include: {
      author: true,
    },
  });

  if (!article) {
    throw Boom.notFound("could not find article");
  }

  if (userId !== article.author.id) {
    Boom.forbidden("You can't delete this article");
  }

  try {
    const deletedArticle = await prisma.article.delete({
      where: {
        slug,
      },
    });

    return h.response().code(204);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to delete article");
  }
}

async function favoriteArticle(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;

  try {
    const article = await prisma.article.update({
      where: {
        slug,
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            following: true,
          },
        },
        favoritedBy: true,
      },
      data: {
        favoritedBy: {
          connect: {
            id: userId,
          },
        },
      },
    });

    if (!article) {
      throw Boom.notFound("could not find article");
    }

    const response = formatArticle(article, userId);
    return h.response({ article: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to favorite article");
  }
}

async function unfavoriteArticle(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;

  try {
    const article = await prisma.article.update({
      where: {
        slug,
      },
      include: {
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            following: true,
          },
        },
        favoritedBy: true,
      },
      data: {
        favoritedBy: {
          disconnect: {
            id: userId,
          },
        },
      },
    });

    if (!article) {
      throw Boom.notFound("could not find article");
    }

    const response = formatArticle(article, userId);
    return h.response({ article: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to unfavorite article");
  }
}

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/articles/{slug}",
    handler: getArticleHandler,
  },
  {
    method: "GET",
    path: "/articles",
    handler: getAllArticleHandler,
  },
  {
    method: "GET",
    path: "/articles/feed",
    handler: getFeedHandler,
    options: {
      auth: {
        strategy: API_AUTH_STATEGY,
      },
    },
  },
  {
    method: "POST",
    path: "/articles",
    handler: createArticleHandler,
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
    handler: updateArticleHandler,
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
    handler: deleteArticleHandler,
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
];

const articlesPlugin: Hapi.Plugin<any> = {
  name: "articles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    server.route(routes);
  },
};

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

interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
}

function formatArticle(article: any, userId: number) {
  let following = article.author.following;
  let favoritedBy = article.favoritedBy;

  const isFollowing = !!following?.map((f: any) => f.id).includes(userId);
  const isFavoritedByMe = !!favoritedBy?.map((f: any) => f.id).includes(userId);
  const author = {
    ...article.author,
    following: isFollowing,
  };

  const formattedArticle: ArticleResponse = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: isFavoritedByMe,
    favoritesCount: favoritedBy.length,
    author,
  };

  return formattedArticle;
}

export default articlesPlugin;
