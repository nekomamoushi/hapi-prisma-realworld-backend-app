import { ServerRoute } from "@hapi/hapi";
import { followUser, getProfile, unfollowUser } from "./handler";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/profiles/{username}",
    handler: getProfile,
  },
  {
    method: "POST",
    path: "/profiles/{username}/follow",
    handler: followUser,
    options: {
      auth: {
        strategy: "jwt",
      },
    },
  },
  {
    method: "DELETE",
    path: "/profiles/{username}/follow",
    handler: unfollowUser,
    options: {
      auth: {
        strategy: "jwt",
      },
    },
  },
];

export { routes };
