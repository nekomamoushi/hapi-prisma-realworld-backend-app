import Glue from "@hapi/glue";
import hapiAuthJwt2 from "hapi-auth-jwt2";

import jwtPlugin from "../src/plugins/jwt";
import prismaPlugin from "../src/plugins/prisma";

import statusPlugin from "../src/api/status";
import usersPlugin from "../src/api/users";
import profilesPlugin from "../src/api/profiles";
import articlesPlugin from "../src/api/articles";
import tagsPlugin from "../src/api/tags";

const manifest: Glue.Manifest = {
  server: {
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
  },
  register: {
    plugins: [
      {
        plugin: prismaPlugin,
      },
      {
        plugin: hapiAuthJwt2,
      },
      {
        plugin: jwtPlugin,
      },
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
    ],
  },
};

export default manifest;
