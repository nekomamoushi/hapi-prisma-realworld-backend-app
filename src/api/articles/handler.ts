import Hapi, { AuthCredentials } from "@hapi/hapi";
import Boom from "@hapi/boom";
import { Prisma } from "@prisma/client";
import slugify from "slugify";

interface ArticlePayload {
  article: {
    title: string;
    description: string;
    body: string;
    tagList: string[];
  };
}

interface CommentPayload {
  comment: {
    body: string;
  };
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

interface CommentResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
}

const articleInclude = {
  author: {
    select: {
      username: true,
      bio: true,
      image: true,
      following: true,
    },
  },
  favoritedBy: true,
};

async function getSingleArticle(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
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

async function getAllArticle(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.params;
  const { limit, offset, author, tag } = request.query;

  const take = limit ? +limit : 0;
  const skip = offset ? +offset : 0;

  const query: any = {
    include: articleInclude,
    orderBy: { updatedAt: "desc" },
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

async function getFeed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { limit, offset } = request.query;

  const take = limit ? +limit : undefined;
  const skip = offset ? +offset : undefined;

  try {
    let articles = await prisma.article.findMany({
      where: {
        author: {
          follower: {
            some: {
              id: userId,
            },
          },
        },
      },
      take,
      skip,
      orderBy: {
        updatedAt: "desc",
      },
      include: articleInclude,
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

async function createArticle(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const {
    article: { title, description, body, tagList },
  } = request.payload as ArticlePayload;

  const data = {
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
  };
  try {
    const article = await prisma.article.create({
      data,
      include: articleInclude,
    });

    const response = formatArticle(article, userId);
    return h.response({ article: response }).code(201);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to update current user");
  }
}

async function updateArticle(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  try {
    const { prisma } = request.server.app;
    const { userId } = request.auth.credentials as AuthCredentials;
    const { slug } = request.params;
    const {
      article: { title, description, body, tagList },
    } = request.payload as ArticlePayload;
    let updatedSlug;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    if (!article) {
      throw Boom.notFound("could not find article");
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
      where: { slug },
      data,
      include: articleInclude,
    });

    const response = formatArticle(updatedArticle, userId);
    return h.response({ article: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to update article");
  }
}

async function deleteArticle(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    throw Boom.notFound("could not find article");
  }

  try {
    await prisma.article.delete({
      where: { slug },
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

  const data = {
    favoritedBy: {
      connect: {
        id: userId,
      },
    },
  };

  try {
    const article = await prisma.article.update({
      where: { slug },
      include: articleInclude,
      data,
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

  const data = {
    favoritedBy: {
      disconnect: {
        id: userId,
      },
    },
  };

  try {
    const article = await prisma.article.update({
      where: { slug },
      include: articleInclude,
      data,
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

async function addCommentToArticle(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug } = request.params;
  const {
    comment: { body },
  } = request.payload as CommentPayload;

  try {
    const comment = await prisma.comment.create({
      data: {
        body,
        author: {
          connect: {
            id: userId,
          },
        },
        article: {
          connect: {
            slug,
          },
        },
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

    const response = formatComment(comment, userId);
    console.log(response);
    return h.response({ comment: response }).code(201);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to add comment to article");
  }
}

function formatComment(comment: any, userId: number) {
  let following = comment.author.following;
  const isFollowing = !!following?.map((f: any) => f.id).includes(userId);
  const author = {
    ...comment.author,
    following: isFollowing,
  };
  const formattedComment: CommentResponse = {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author,
  };
  return formattedComment;
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

export {
  getAllArticle,
  getFeed,
  getSingleArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
  addCommentToArticle,
};
