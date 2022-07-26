import Code from "@hapi/code";
import Lab from "@hapi/lab";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server";
import { TagResponse } from "../src/api/tags/handler";
import { UserPayload } from "../src/api/users/handler";

const { describe, it, afterEach, beforeEach } = (exports.lab = Lab.script());
const { expect } = Code;

describe("server status", () => {
  let server: Hapi.Server;
  let token: string | undefined;

  beforeEach(async () => {
    server = await createServer();
    server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("get all tags", async () => {
    const allTags = await server.inject({
      method: "GET",
      url: "/api/tags",
    });

    expect(allTags.statusCode).to.equal(200);
    const { tags } = JSON.parse(allTags.payload) as TagResponse;
    expect(tags).to.be.an.array();
    expect(tags.length).to.equal(8);
  });

  it("logins a user and creates article", async () => {
    const loginUser = await server.inject({
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

    let createdArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      headers: {
        Authorization: `Token ${token}`,
      },
      payload: {
        article: {
          title: "When the sun goes down ?",
          description: "Easy right?",
          body: "At sunset",
          tagList: ["sun", "time"],
        },
      },
    });

    expect(createdArticle.statusCode).to.equal(201);
  });

  it("get all tags", async () => {
    const allTags = await server.inject({
      method: "GET",
      url: "/api/tags",
    });

    expect(allTags.statusCode).to.equal(200);
    const { tags } = JSON.parse(allTags.payload) as TagResponse;
    expect(tags).to.be.an.array();
    expect(tags.length).to.equal(10);
  });
});
