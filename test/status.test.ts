import Code from "@hapi/code";
import Lab from "@hapi/lab";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server";

const { describe, it, afterEach, beforeEach } = (exports.lab = Lab.script());
const { expect } = Code;

describe("server status", () => {
  let server: Hapi.Server;

  beforeEach(async () => {
    server = await createServer();
    server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("should get status server up", async () => {
    const statusServer = await server.inject({
      method: "GET",
      url: "/",
    });
    expect(statusServer.statusCode).to.equal(200);

    const status = JSON.parse(statusServer.payload);
    expect(status).equal({
      up: true,
    });
  });
});
