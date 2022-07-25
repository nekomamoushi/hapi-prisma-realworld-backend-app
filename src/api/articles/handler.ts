import Hapi, { AuthCredentials } from "@hapi/hapi";
import Boom from "@hapi/boom";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

export interface ArticlePayload {
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

export interface ArticlesResponse {
  articles: ArticleResponse[];
  articlesCount: number;
}
export interface ArticleResponse {
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

export interface CommentResponse {
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
  const { credentials } = request.auth;
  const { slug } = request.params;
  let userId;

  if (credentials) {
    userId = credentials.userId;
  }

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
  const { limit, offset, author, tag, favorited } = request.query;

  const take = limit ? +limit : 0;
  const skip = offset ? +offset : 0;

  const query: any = {
    include: articleInclude,
    orderBy: { updatedAt: "desc" },
  };

  if (author || tag || favorited) {
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

  if (favorited) {
    query["where"]["AND"].push({
      favoritedBy: {
        some: {
          username: {
            equals: favorited,
          },
        },
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
    const operations: any[] = [
      prisma.article.create({
        data,
        include: articleInclude,
      }),
    ];

    const tagsToAdd = await filterUniqueTags(prisma, tagList);
    if (tagsToAdd.length > 0) {
      operations.push(
        prisma.tag.createMany({
          data: tagsToAdd,
        })
      );
    }

    const [article, _] = await prisma.$transaction(operations);

    const response = formatArticle(article, userId);
    return h.response({ article: response }).code(201);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to create article");
  }
}

async function filterUniqueTags(prisma: PrismaClient, tagList: string[]) {
  if (!tagList || tagList.length === 0) {
    return [];
  }
  const allTags = await prisma.tag.findMany();
  const allTagsStringArray = allTags.map((tag) => tag.tag);
  const tagsToAdd = tagList.filter((tagName: string) => {
    return !allTagsStringArray.includes(tagName);
  });
  return tagsToAdd.map((tag) => ({ tag: tag }));
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

    const articleToUpdate = await prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    if (!articleToUpdate) {
      throw Boom.notFound("could not find article");
    }

    if (title && title !== articleToUpdate.title) {
      updatedSlug = slugify(title);
    }

    const data = {
      title: title || articleToUpdate.title,
      slug: title ? updatedSlug : articleToUpdate.slug,
      description: description || articleToUpdate.description,
      body: body || articleToUpdate.body,
      tagList: tagList || articleToUpdate.tagList,
    };

    const operations: any[] = [
      prisma.article.update({
        where: { slug },
        data,
        include: articleInclude,
      }),
    ];

    const tagsToAdd = await filterUniqueTags(prisma, tagList);
    if (tagsToAdd.length > 0) {
      operations.push(
        prisma.tag.createMany({
          data: tagsToAdd,
        })
      );
    }

    const [updatedArticle, _] = await prisma.$transaction(operations);

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
    return h.response({ comment: response }).code(201);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to add comment to article");
  }
}

async function getCommentsToArticle(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { credentials } = request.auth;
  const { slug } = request.params;
  let userId: number;

  if (credentials) {
    userId = credentials.userId;
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { article: { slug } },
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

    const response = comments.map((comment) => {
      return formatComment(comment, userId);
    });

    return h.response({ comments: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to add comment to article");
  }
}

async function deleteCommentToArticle(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const { userId } = request.auth.credentials as AuthCredentials;
  const { slug, id } = request.params;

  try {
    const comment = await prisma.comment.delete({
      where: {
        id: +id,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return h.response({ comment: comment }).code(200);
  } catch (err: any) {
    request.log("error", err);
    if (err.isBoom) {
      return err;
    }
    return Boom.badImplementation("failed to delete comment to article");
  }
}

function formatComment(comment: any, userId: number | undefined) {
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

function formatArticle(article: any, userId: number | undefined) {
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
  getCommentsToArticle,
  deleteCommentToArticle,
};
