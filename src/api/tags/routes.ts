import { ServerRoute } from "@hapi/hapi";
import { getTags } from "./handler";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/api/tags",
    handler: getTags,
    options: {
      description: "Get All Tags",
      notes: "Returns an array of tags",
      tags: ["api", "Tags"],
      auth: false,
    },
  },
];

export { routes };
