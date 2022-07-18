import Hapi from "@hapi/hapi";

const articlesPlugin: Hapi.Plugin<any> = {
  name: "articles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    console.log("register articles plugin");
  },
};

export default articlesPlugin;
