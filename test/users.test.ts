import Code from "@hapi/code";
import Lab from "@hapi/lab";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server";
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

  it("fails to register user", async () => {
    let registerUser = await server.inject({
      method: "POST",
      url: "/api/users",
      payload: {
        user: {
          username: "",
          email: "",
          password: "",
        },
      },
    });

    expect(registerUser.statusCode).to.equal(422);
    expect(registerUser.result).equal({
      errors: {
        email: ["can't be blank"],
      },
    });

    registerUser = await server.inject({
      method: "POST",
      url: "/api/users",
      payload: {
        user: {
          username: "",
          email: "user@test.com",
          password: "",
        },
      },
    });
    expect(registerUser.statusCode).to.equal(422);
    expect(registerUser.result).equal({
      errors: {
        username: ["can't be blank"],
      },
    });

    registerUser = await server.inject({
      method: "POST",
      url: "/api/users",
      payload: {
        user: {
          username: "usertest",
          email: "user@test.com",
          password: "",
        },
      },
    });
    expect(registerUser.statusCode).to.equal(422);
    expect(registerUser.result).equal({
      errors: {
        password: ["can't be blank"],
      },
    });
  });

  it("registers a valid user", async () => {
    let registerUser = await server.inject({
      method: "POST",
      url: "/api/users",
      payload: {
        user: {
          username: "username",
          email: "useremail@email.com",
          password: "password",
        },
      },
    });

    expect(registerUser.statusCode).to.equal(200);

    const { user: registerUserPayload } = JSON.parse(
      registerUser.payload
    ) as UserPayload;

    expect(registerUserPayload.username).to.equal("username");
    expect(registerUserPayload.email).to.equal("useremail@email.com");
    expect(registerUserPayload.bio).to.be.empty();
    expect(registerUserPayload.image).to.be.empty();
    expect(registerUserPayload.token).to.exist().to.be.a.string();
  });

  it("forbids to register a user with an existing email", async () => {
    let registerUser = await server.inject({
      method: "POST",
      url: "/api/users",
      payload: {
        user: {
          username: "username2",
          email: "useremail@email.com",
          password: "password",
        },
      },
    });

    expect(registerUser.statusCode).to.equal(403);
  });

  it("fails to login user", async () => {
    let loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "",
          password: "",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(422);
    expect(loginUser.result).equal({
      errors: {
        email: ["can't be blank"],
      },
    });

    loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "user@test.com",
          password: "",
        },
      },
    });
    expect(loginUser.statusCode).to.equal(422);
    expect(loginUser.result).equal({
      errors: {
        password: ["can't be blank"],
      },
    });

    loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "",
          password: "password",
        },
      },
    });
    expect(loginUser.statusCode).to.equal(422);
    expect(loginUser.result).equal({
      errors: {
        email: ["can't be blank"],
      },
    });
  });

  it("forbids to login a invalid user", async () => {
    let loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "wrong@email.com",
          password: "password",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(404);

    loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "useremail@email.com",
          password: "password2",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(403);
  });

  it("logins a valid user", async () => {
    let loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "useremail@email.com",
          password: "password",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(200);

    const { user: loginUserPayload } = JSON.parse(
      loginUser.payload
    ) as UserPayload;

    expect(loginUserPayload.username).to.equal("username");
    expect(loginUserPayload.email).to.equal("useremail@email.com");
    expect(loginUserPayload.bio).to.be.empty();
    expect(loginUserPayload.image).to.be.empty();
    expect(loginUserPayload.token).to.exist().to.be.a.string();

    token = loginUserPayload.token;
  });

  it("forbids to get user info with wrong credentials", async () => {
    const currentUser = await server.inject({
      method: "GET",
      url: "/api/user",
    });

    expect(currentUser.statusCode).to.equal(401);
  });

  it("gets current user info", async () => {
    const currentUser = await server.inject({
      method: "GET",
      url: "/api/user",
      headers: {
        authorization: `Token ${token}`,
      },
    });

    expect(currentUser.statusCode).to.equal(200);

    const { user: currentUserPayload } = JSON.parse(
      currentUser.payload
    ) as UserPayload;

    expect(currentUserPayload.username).to.equal("username");
    expect(currentUserPayload.email).to.equal("useremail@email.com");
    expect(currentUserPayload.bio).to.be.empty();
    expect(currentUserPayload.image).to.be.empty();
    expect(currentUserPayload.token).to.exist().to.be.a.string();
    expect(currentUserPayload.token).to.equal(token);
  });

  it("forbids to update user info with wrong credentials", async () => {
    const currentUser = await server.inject({
      method: "GET",
      url: "/api/user",
    });

    expect(currentUser.statusCode).to.equal(401);
  });

  it("updates user info", async () => {
    let udpateUser = await server.inject({
      method: "PUT",
      url: "/api/user",
      headers: {
        authorization: `Token ${token}`,
      },
      payload: {
        user: {
          bio: "je suis une fougere",
        },
      },
    });

    expect(udpateUser.statusCode).to.equal(200);

    const { user: currentUserPayload } = JSON.parse(
      udpateUser.payload
    ) as UserPayload;

    expect(currentUserPayload.username).to.equal("username");
    expect(currentUserPayload.email).to.equal("useremail@email.com");
    expect(currentUserPayload.bio).to.equal("je suis une fougere");
    expect(currentUserPayload.image).to.be.empty();
    expect(currentUserPayload.token).to.exist().to.be.a.string();
    expect(currentUserPayload.token).to.equal(token);

    udpateUser = await server.inject({
      method: "PUT",
      url: "/api/user",
      headers: {
        authorization: `Token ${token}`,
      },
      payload: {
        user: {
          password: "wordpass",
        },
      },
    });

    expect(udpateUser.statusCode).to.equal(200);

    let loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "useremail@email.com",
          password: "password",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(403);

    loginUser = await server.inject({
      method: "POST",
      url: "/api/users/login",
      payload: {
        user: {
          email: "useremail@email.com",
          password: "wordpass",
        },
      },
    });

    expect(loginUser.statusCode).to.equal(200);
  });
});
