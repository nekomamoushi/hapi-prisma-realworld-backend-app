import Joi from "joi";

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

const commentPayloadValidator = Joi.object({
  comment: Joi.object({
    body: Joi.string().required(),
  }),
});

const createArticleValidator = articlePayloadValidator.tailor("create");
const updateArticleValidator = articlePayloadValidator.tailor("update");

export {
  createArticleValidator,
  updateArticleValidator,
  commentPayloadValidator,
};
