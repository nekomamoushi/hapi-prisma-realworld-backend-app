import Joi from "joi";

const userPayloadValidator = Joi.object({
  user: Joi.object({
    email: Joi.string().alter({
      register: (schema) =>
        schema.required().error((errors) => new Error(`email can't be blank`)),
      login: (schema) => schema.required(),
    }),
    username: Joi.string().alter({
      register: (schema) =>
        schema
          .required()
          .error((errors) => new Error(`username can't be blank`)),
      login: (schema) => schema.optional(),
    }),
    password: Joi.string().alter({
      register: (schema) =>
        schema
          .required()
          .error((errors) => new Error(`password can't be blank`)),
      login: (schema) => schema.required(),
    }),
    bio: Joi.string().optional(),
    image: Joi.string().optional(),
  }),
});

const registerUserValidator = userPayloadValidator.tailor("register");
const loginUserValidator = userPayloadValidator.tailor("login");

export { registerUserValidator, loginUserValidator };
