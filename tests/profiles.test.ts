import Code from "@hapi/code";
import Lab from "@hapi/lab";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server";
import { ProfileResponse } from "../src/api/profiles/handler";
import { UserPayload } from "../src/api/users/handler";

const { describe, it, after, before } = (exports.lab = Lab.script());
const { expect } = Code;

describe("profiles", () => {
  let server: Hapi.Server;
  let token: string | undefined;
  let commentId: number | undefined;

  before(async () => {
    server = await createServer();
    server.start();
  });

  after(async () => {
    await server.stop();
  });

  it("gets profile user (unauthenticated)", async () => {
    const userProfile = await server.inject({
      method: "GET",
      url: "/api/profiles/naboo",
    });

    console.log(userProfile.result);
    expect(userProfile.statusCode).to.equal(200);
    const { profile } = JSON.parse(userProfile.payload) as {
      profile: ProfileResponse;
    };

    expect(profile.username).to.equal("naboo");
    expect(profile.following).to.equal(false);
  });

  it("logins a user", async () => {
    let loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "germione@prisma.com",
          password: "passeword",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(200);
    const { user } = JSON.parse(loginUser.payload) as UserPayload;

    token = user.token;
  });

  it("forbids to follow profile user (unauthicated)", async () => {
    const followProfile = await server.inject({
      method: "POST",
      url: "/api/profiles/naboo/follow",
    });

    expect(followProfile.statusCode).to.equal(401);
  });

  it("follows profile user", async () => {
    const followProfile = await server.inject({
      method: "POST",
      url: "/api/profiles/naboo/follow",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(followProfile.statusCode).to.equal(200);
  });

  it("gets profile user", async () => {
    const userProfile = await server.inject({
      method: "GET",
      url: "/api/profiles/naboo",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(userProfile.statusCode).to.equal(200);
    const { profile } = JSON.parse(userProfile.payload) as {
      profile: ProfileResponse;
    };

    expect(profile.username).to.equal("naboo");
    expect(profile.following).to.equal(true);
  });

  it("forbids to unfollow profile user (unauthenticated)", async () => {
    const unfollowProfile = await server.inject({
      method: "DELETE",
      url: "/api/profiles/naboo/follow",
    });

    expect(unfollowProfile.statusCode).to.equal(401);
  });

  it("unfollows profile user", async () => {
    const unfollowProfile = await server.inject({
      method: "DELETE",
      url: "/api/profiles/naboo/follow",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(unfollowProfile.statusCode).to.equal(200);
  });

  it("gets profile user", async () => {
    const userProfile = await server.inject({
      method: "GET",
      url: "/api/profiles/naboo",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(userProfile.statusCode).to.equal(200);
    const { profile } = JSON.parse(userProfile.payload) as {
      profile: ProfileResponse;
    };

    expect(profile.username).to.equal("naboo");
    expect(profile.following).to.equal(false);
  });
});
