import Code from "@hapi/code";
import Lab from "@hapi/lab";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server";
import { UserPayload } from "../src/api/users/handler";
import {
  ArticlePayload,
  ArticleResponse,
  ArticlesResponse,
  CommentResponse,
} from "../src/api/articles/handler";

const { describe, it, after, before } = (exports.lab = Lab.script());
const { expect } = Code;

describe("server status", () => {
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

  it("creates an article with no tags", async () => {
    let createdArticle = await server.inject({
      method: "POST",
      url: "/api/articles",
      headers: {
        Authorization: `token ${token}`,
      },
      payload: {
        article: {
          title: "Can you feel the love tonight?",
          description: "Easy right?",
          body: "At night",
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

  it("updates an article wiith no tags", async () => {
    let createdArticle = await server.inject({
      method: "PUT",
      url: "/api/articles/Can-you-feel-the-love-tonight",
      headers: {
        Authorization: `token ${token}`,
      },
      payload: {
        article: {
          description: "Easy lover",
        },
      },
    });

    expect(createdArticle.statusCode).to.equal(200);

    const { article } = JSON.parse(createdArticle.payload) as {
      article: ArticleResponse;
    };
    expect(article).to.be.an.object();
    expect(article.slug).to.equal("Can-you-feel-the-love-tonight");
    expect(article.body).to.equal("At night");
    expect(article.description).to.equal("Easy lover");
    expect(article.author).to.be.an.object();
    expect(article.author.username).to.equal("germione");
  });

  it("forbids to favorite an article", async () => {
    let article = await server.inject({
      method: "POST",
      url: "/api/articles/How-angular-standalone-components-works/favorite",
    });

    expect(article.statusCode).to.equal(401);
  });

  it("favorite an article", async () => {
    let favoritedArticle = await server.inject({
      method: "POST",
      url: "/api/articles/How-angular-standalone-components-works/favorite",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    expect(favoritedArticle.statusCode).to.equal(200);
  });

  it("check favorite count for an article", async () => {
    let favoritedArticle = await server.inject({
      method: "GET",
      url: "/api/articles/How-angular-standalone-components-works",
      headers: {
        Authorization: `token ${token}`,
      },
    });
    expect(favoritedArticle.statusCode).to.equal(200);
    const { article } = JSON.parse(favoritedArticle.payload) as {
      article: ArticleResponse;
    };
    expect(article).to.be.an.object();
    expect(article.favorited).to.be.a.boolean().to.equal(true);
    expect(article.favoritesCount).to.equal(1);

    expect(article.author).to.be.an.object();
    expect(article.author.username).to.equal("naboo");
  });

  it("gets all article favorited by a user", async () => {
    const favoritedArticles = await server.inject({
      method: "GET",
      url: "/api/articles?favorited=germione",
    });

    expect(favoritedArticles.statusCode).to.equal(200);
    const { articles, articlesCount } = JSON.parse(
      favoritedArticles.payload
    ) as ArticlesResponse;
    expect(articlesCount).to.equal(1);
  });

  it("forbids to unfavorite an article", async () => {
    let article = await server.inject({
      method: "DELETE",
      url: "/api/articles/How-angular-standalone-components-works/favorite",
    });

    expect(article.statusCode).to.equal(401);
  });

  it("unfavorite an article", async () => {
    let article = await server.inject({
      method: "DELETE",
      url: "/api/articles/How-angular-standalone-components-works/favorite",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    expect(article.statusCode).to.equal(200);
  });

  it("check favorite count for an article", async () => {
    let favoritedArticle = await server.inject({
      method: "GET",
      url: "/api/articles/How-angular-standalone-components-works",
      headers: {
        Authorization: `token ${token}`,
      },
    });
    expect(favoritedArticle.statusCode).to.equal(200);
    const { article } = JSON.parse(favoritedArticle.payload) as {
      article: ArticleResponse;
    };
    expect(article).to.be.an.object();
    expect(article.favorited).to.be.a.boolean().to.equal(false);
    expect(article.favoritesCount).to.equal(0);

    expect(article.author).to.be.an.object();
    expect(article.author.username).to.equal("naboo");
  });

  it("gets all article favorited by a user", async () => {
    const favoritedArticles = await server.inject({
      method: "GET",
      url: "/api/articles?favorited=germione",
    });

    expect(favoritedArticles.statusCode).to.equal(200);
    const { articlesCount } = JSON.parse(
      favoritedArticles.payload
    ) as ArticlesResponse;
    expect(articlesCount).to.equal(0);
  });

  it("gets comments for an article", async () => {
    let articleComments = await server.inject({
      method: "GET",
      url: "/api/articles/How-angular-standalone-components-works/comments",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(articleComments.statusCode).to.equal(200);
    const { comments } = JSON.parse(articleComments.payload) as {
      comments: CommentResponse[];
    };
    expect(comments).to.be.an.array();
    expect(comments.length).to.equal(0);
  });

  it("creates comment for an article", async () => {
    let articleComment = await server.inject({
      method: "POST",
      url: "/api/articles/How-angular-standalone-components-works/comments",
      headers: {
        Authorization: `Token ${token}`,
      },
      payload: {
        comment: {
          body: "It's sucks!",
        },
      },
    });

    expect(articleComment.statusCode).to.equal(201);
    const { comment } = JSON.parse(articleComment.payload) as {
      comment: CommentResponse;
    };
    expect(comment).to.be.an.object();
    expect(comment.body).to.equal("It's sucks!");
    expect(comment.author.username).to.equal("germione");
  });

  it("gets comments for an article", async () => {
    let articleComments = await server.inject({
      method: "GET",
      url: "/api/articles/How-angular-standalone-components-works/comments",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(articleComments.statusCode).to.equal(200);
    const { comments } = JSON.parse(articleComments.payload) as {
      comments: CommentResponse[];
    };
    expect(comments).to.be.an.array();
    expect(comments.length).to.equal(1);
  });

  it("creates comment for an article", async () => {
    let articleComment = await server.inject({
      method: "POST",
      url: "/api/articles/How-angular-standalone-components-works/comments",
      headers: {
        Authorization: `Token ${token}`,
      },
      payload: {
        comment: {
          body: "It's sucks!",
        },
      },
    });

    expect(articleComment.statusCode).to.equal(201);
    const { comment } = JSON.parse(articleComment.payload) as {
      comment: CommentResponse;
    };
    expect(comment).to.be.an.object();
    expect(comment.body).to.equal("It's sucks!");
    expect(comment.author.username).to.equal("germione");

    commentId = comment.id;
  });

  it("deletes comment for an article", async () => {
    let deletedComment = await server.inject({
      method: "DELETE",
      url: `/api/articles/How-angular-standalone-components-works/comments/${commentId}`,
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    expect(deletedComment.statusCode).to.equal(200);
  });
});
