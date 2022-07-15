import Hapi from "@hapi/hapi";

const usersPlugin: Hapi.Plugin<any> = {
  name: "users",
  register: async function (server: Hapi.Server) {
    console.log("register users plugin");
  },
};

export default usersPlugin;
