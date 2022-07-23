import Hapi, { server } from "@hapi/hapi";
import Glue from "@hapi/glue";
import hapiAuthJwt2 from "hapi-auth-jwt2";

import HapiInert from "@hapi/inert";
import HapiVision from "@hapi/vision";
import HapiSwagger from "hapi-swagger";
import Package from "../package.json";
import jwtPlugin from "../src/plugins/jwt";
import prismaPlugin from "../src/plugins/prisma";
import statusPlugin from "../src/api/status";
import usersPlugin from "../src/api/users";
import profilesPlugin from "../src/api/profiles";
import articlesPlugin from "../src/api/articles";
import tagsPlugin from "../src/api/tags";

const serverOptions: Hapi.ServerOptions = {
  host: "localhost",
  port: 3001,
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
    plugin: prismaPlugin,
  },
  // JWT authentication
  {
    plugin: hapiAuthJwt2,
  },
  {
    plugin: jwtPlugin,
  },
  //***********************
  //  APPLICATION ROUTES  *
  //***********************
  {
    plugin: statusPlugin,
  },
  {
    plugin: usersPlugin,
  },
  {
    plugin: profilesPlugin,
  },
  {
    plugin: articlesPlugin,
  },
  {
    plugin: tagsPlugin,
  },
];

const manifest: Glue.Manifest = {
  server: serverOptions,
  register: {
    plugins: pluginList,
  },
};

export default manifest;
