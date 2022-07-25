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
});
