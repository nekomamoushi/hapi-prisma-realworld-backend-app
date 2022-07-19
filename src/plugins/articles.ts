import Hapi, { AuthCredentials, ServerRoute } from "@hapi/hapi";
import Boom from "@hapi/boom";
import Joi from "joi";
import slugify from "slugify";
import { Prisma } from "@prisma/client";

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
      },
    });

    const response = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
    };
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

    const response = {
      slug: updatedArticle.slug,
      title: updatedArticle.title,
      description: updatedArticle.description,
      body: updatedArticle.body,
      tagList: updatedArticle.tagList,
      createdAt: updatedArticle.createdAt,
      updatedAt: updatedArticle.updatedAt,
      author: updatedArticle.author,
    };
    return h.response({ article: response }).code(200);
  } catch (err: any) {
    request.log("error", err);
    return Boom.badImplementation("failed to update article");
  }
}

const routes: ServerRoute[] = [
  {
    method: "POST",
    path: "/articles",
    handler: createArticleHandler,
    options: {
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
      validate: {
        payload: updateArticleValidator,
        failAction: (request, h, err: any) => {
          err = formatValidationErrors(err);
          throw err;
        },
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

export default articlesPlugin;
