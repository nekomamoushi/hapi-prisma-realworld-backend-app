import Code from "@hapi/code";
import Lab from "@hapi/lab";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server";
import { UserPayload } from "../src/api/users/handler";
import {
  ArticlePayload,
  ArticleResponse,
  ArticlesResponse,
} from "../src/api/articles/handler";

const { describe, it, after, before } = (exports.lab = Lab.script());
const { expect } = Code;

describe("server status", () => {
  let server: Hapi.Server;
  let token: string | undefined;

  before(async () => {
    server = await createServer();
    server.start();
  });

  after(async () => {
    await server.stop();
  });

  it("can't get feed (unauthenticated)", async () => {
    let allArticles = await server.inject({
      method: "GET",
      url: "/api/articles/feed",
    });

    expect(allArticles.statusCode).to.equal(401);
  });

  it("finds all article (unauthenticated)", async () => {
    let allArticles = await server.inject({
      method: "GET",
      url: "/api/articles",
    });

    expect(allArticles.statusCode).to.equal(200);

    const { articles } = JSON.parse(allArticles.payload) as ArticlesResponse;

    expect(articles).to.be.an.array();
    expect(articles.length).to.be.equal(3);
  });

  it("finds all article with query tag dragons (unauthenticated)", async () => {
    let allArticles = await server.inject({
      method: "GET",
      url: "/api/articles?tag=dragons",
    });

    expect(allArticles.statusCode).to.equal(200);
    const { articles, articlesCount } = JSON.parse(
      allArticles.payload
    ) as ArticlesResponse;

    expect(articles).to.be.an.array();
    expect(articles.length).to.be.equal(0);
    expect(articlesCount).to.be.equal(0);
  });

  it("finds all article with query tag animal (unauthenticated)", async () => {
    let allArticles = await server.inject({
      method: "GET",
      url: "/api/articles?tag=animal",
    });

    expect(allArticles.statusCode).to.equal(200);
    const { articles, articlesCount } = JSON.parse(
      allArticles.payload
    ) as ArticlesResponse;

    expect(articles).to.be.an.array();
    expect(articles.length).to.be.equal(2);
    expect(articlesCount).to.be.equal(2);
  });

  it("finds all article with query author germione (unauthenticated)", async () => {
    let allArticles = await server.inject({
      method: "GET",
      url: "/api/articles?author=germione",
    });

    expect(allArticles.statusCode).to.equal(200);
    const { articles, articlesCount } = JSON.parse(
      allArticles.payload
    ) as ArticlesResponse;

    expect(articles).to.be.an.array();
    expect(articles.length).to.be.equal(2);
    expect(articlesCount).to.be.equal(2);
  });

  it("don't find an article (unauthenticated)", async () => {
    let nonExistingArticle = await server.inject({
      method: "GET",
      url: "/api/articles/How-you-doing",
    });

    expect(nonExistingArticle.statusCode).to.equal(404);
  });

  it("find a single article (unauthenticated)", async () => {
    let existingArticle = await server.inject({
      method: "GET",
      url: "/api/articles/How-to-eat-a-fish",
    });

    expect(existingArticle.statusCode).to.equal(200);
    const { article } = JSON.parse(existingArticle.payload) as {
      article: ArticleResponse;
    };
    expect(article).to.be.an.object();
    expect(article.author).to.be.an.object();
    expect(article.author.username).to.be.a.string().to.be.equal("germione");
  });

  it("logins a valid user", async () => {
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

    const { user: loginUserPayload } = JSON.parse(
      loginUser.payload
    ) as UserPayload;

    token = loginUserPayload.token;
  });

  it("gets feed for a user", async () => {
    let feed = await server.inject({
      method: "GET",
      url: "/api/articles/feed",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    expect(feed.statusCode).to.equal(200);

    const { articles, articlesCount } = JSON.parse(
      feed.payload
    ) as ArticlesResponse;

    expect(articles).to.be.an.array();
    expect(articles.length).to.equal(0);
    expect(articlesCount).to.be.a.number().to.equal(0);
  });

  it("finds all article", async () => {
    let allArticles = await server.inject({
      method: "GET",
      url: "/api/articles",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    expect(allArticles.statusCode).to.equal(200);

    const { articles } = JSON.parse(allArticles.payload) as ArticlesResponse;

    expect(articles).to.be.an.array();
    expect(articles.length).to.be.equal(3);
  });

  it("fails to create an article", async () => {
    let nonCreaterArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      payload: {
        article: {
          title: "When the sun goes down",
          description: "Easy right?",
          body: "At sunset",
          tagList: ["sun", "time"],
        },
      },
    });

    expect(nonCreaterArticle.statusCode).to.equal(401);

    nonCreaterArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      headers: {
        Authorization: `token ${token}`,
      },
      payload: {
        article: {
          title: "",
          description: "Easy right?",
          body: "At sunset",
          tagList: ["sun", "time"],
        },
      },
    });

    expect(nonCreaterArticle.statusCode).to.equal(422);
    expect(nonCreaterArticle.result).equal({
      errors: {
        title: ["can't be blank"],
      },
    });

    nonCreaterArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      headers: {
        Authorization: `token ${token}`,
      },
      payload: {
        article: {
          title: "Hey I just met you",
          description: "",
          body: "At sunset",
          tagList: ["sun", "time"],
        },
      },
    });

    expect(nonCreaterArticle.statusCode).to.equal(422);
    expect(nonCreaterArticle.result).equal({
      errors: {
        description: ["can't be blank"],
      },
    });

    nonCreaterArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      headers: {
        Authorization: `token ${token}`,
      },
      payload: {
        article: {
          title: "Hey I just met you",
          description: "Desc",
          body: "",
          tagList: ["sun", "time"],
        },
      },
    });

    expect(nonCreaterArticle.statusCode).to.equal(422);
    expect(nonCreaterArticle.result).equal({
      errors: {
        body: ["can't be blank"],
      },
    });
  });

  it("creates an article", async () => {
    let createdArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      headers: {
        Authorization: `token ${token}`,
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

    const { article } = JSON.parse(createdArticle.payload) as {
      article: ArticleResponse;
    };
    expect(article).to.be.an.object();
    expect(article.author).to.be.an.object();
    expect(article.author.username).to.equal("germione");
  });

  it("updates an article", async () => {
    let createdArticle = await server.inject({
      method: "PUT",
      url: "/api/articles/When-the-sun-goes-down",
      headers: {
        Authorization: `token ${token}`,
      },
      payload: {
        article: {
          title: "When the sun goes up ?",
          description: "Easy right?",
          body: "At dawn",
          tagList: ["sun", "time"],
        },
      },
    });

    expect(createdArticle.statusCode).to.equal(200);

    const { article } = JSON.parse(createdArticle.payload) as {
      article: ArticleResponse;
    };
    expect(article).to.be.an.object();
    expect(article.slug).to.equal("When-the-sun-goes-up");
    expect(article.body).to.equal("At dawn");
    expect(article.author).to.be.an.object();
    expect(article.author.username).to.equal("germione");
  });
});
