import { createServer, IncomingMessage, ServerResponse } from "http";

// import with .js, and not ts.
// for more info: https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#type-in-package-json-and-new-extensions
import { getExample, mainRoute, createRoute } from "./routes.js";
import { GET_SEGEL, LOGIN, SIGNUP } from "./const.js";
import { loginRoute, signupRoute } from "./auth.js";

const port = process.env.PORT || 3000;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const route = createRoute(req.url, req.method);
  switch (route) {
    case GET_SEGEL:
      getExample(req, res);
      break;
    case LOGIN:
      loginRoute(req, res);
      break;
    case SIGNUP:
      signupRoute(req, res);
      break;

    default:
      mainRoute(req, res);
      break;
  }
});

server.listen(port);
console.log(`Server running! port ${port}`);
