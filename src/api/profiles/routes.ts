import { ServerRoute } from "@hapi/hapi";
import { API_AUTH_STATEGY } from "../../helpers/jwt";
import { followUser, getProfile, unfollowUser } from "./handler";

const routes: ServerRoute[] = [
  {
    method: "GET",
    path: "/api/profiles/{username}",
    handler: getProfile,
    options: {
      description: "Get User Profile Information",
      notes: "Returns a Profile Object",
      tags: ["api", "Profiles"],
      auth: {
        strategy: API_AUTH_STATEGY,
        mode: "try",
      },
    },
  },
  {
    method: "POST",
    path: "/api/profiles/{username}/follow",
    handler: followUser,
    options: {
      description: "Follow a User",
      notes: "Returns a Profile Object",
      tags: ["api", "Profiles"],
      auth: {
        strategy: "jwt",
      },
    },
  },
  {
    method: "DELETE",
    path: "/api/profiles/{username}/follow",
    handler: unfollowUser,
    options: {
      description: "Unfollow a User",
      notes: "Returns a Profile Object",
      tags: ["api", "Profiles"],
      auth: {
        strategy: "jwt",
      },
    },
  },
];

export { routes };
