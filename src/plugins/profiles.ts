import Hapi from "@hapi/hapi";

const profilesPlugin: Hapi.Plugin<any> = {
  name: "profiles",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    console.log("register profiles plugin");
  },
};

async function getProfileHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { username } = request.params;
  console.log(username);
}

export default profilesPlugin;
