import dotenv from "dotenv";
import Hapi, { server } from "@hapi/hapi";
import Glue from "@hapi/glue";
import HapiAuthJwt2 from "hapi-auth-jwt2";

import HapiInert from "@hapi/inert";
import HapiVision from "@hapi/vision";
import HapiSwagger from "hapi-swagger";

import Package from "../package.json";
import JwtPlugin from "../src/plugins/jwt";
import PrismaPlugin from "../src/plugins/prisma";
import StatusPlugin from "../src/api/status";
import UsersPlugin from "../src/api/users";
import ProfilesPlugin from "../src/api/profiles";
import ArticlesPlugin from "../src/api/articles";
import TagsPlugin from "../src/api/tags";

dotenv.config({ path: `${__dirname}/../.env` });

const serverOptions: Hapi.ServerOptions = {
  host: process.env.HAPI_HOST || "localhost",
  port: process.env.HAPI_PORT || 3001,
  router: {
    stripTrailingSlash: true,
  },
  routes: {
    cors: {
      origin: ["*"], // an array of origins or 'ignore'
    },
  },
};

const swaggerOptions: HapiSwagger.RegisterOptions = {
  info: {
    title: "Test API Documentation",
    version: Package.version,
  },
  grouping: "tags",
  schemes: ["http"],
};

const pluginList = [
  // Static File and Directory Handler
  {
    plugin: HapiInert,
  },
  {
    plugin: HapiVision,
  },
  // OpenAPI: Swagger
  {
    plugin: HapiSwagger,
    options: swaggerOptions,
  },
  {
    plugin: PrismaPlugin,
  },
  // JWT authentication
  {
    plugin: HapiAuthJwt2,
  },
  {
    plugin: JwtPlugin,
  },
  //***********************
  //  APPLICATION ROUTES  *
  //***********************
  {
    plugin: StatusPlugin,
  },
  {
    plugin: UsersPlugin,
  },
  {
    plugin: ProfilesPlugin,
  },
  {
    plugin: ArticlesPlugin,
  },
  {
    plugin: TagsPlugin,
  },
];

const manifest: Glue.Manifest = {
  server: serverOptions,
  register: {
    plugins: pluginList,
  },
};

export default manifest;
