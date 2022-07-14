import { createServer, startServer } from "./src/server";

createServer()
  .then(startServer)
  .catch((err) => {
    console.log(err);
  });
