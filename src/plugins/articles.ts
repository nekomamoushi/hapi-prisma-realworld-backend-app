import Hapi, { AuthCredentials, ServerRoute } from "@hapi/hapi";
import Boom from "@hapi/boom";
import Joi from "joi";
import slugify from "slugify";

interface ArticlePayload {
  article: {
    title: string;
    description: string;
    body: string;
    tagList?: string[];
  };
}

const articlePayloadValidator = Joi.object({
  article: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    body: Joi.string().required(),
    tagList: Joi.array().optional(),
  }),
});

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

const routes: ServerRoute[] = [
  {
    method: "POST",
    path: "/articles",
    handler: createArticleHandler,
    options: {
      validate: {
        payload: articlePayloadValidator,
        failAction: (request, h, err: any) => {
          console.log(err);
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
