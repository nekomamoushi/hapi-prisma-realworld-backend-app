import { ServerRoute } from "@hapi/hapi";
import { getTags } from "./handler";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/api/tags",
    handler: getTags,
    options: {
      auth: false,
    },
  },
];

export { routes };
