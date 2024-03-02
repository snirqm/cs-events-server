import { IncomingMessage, ServerResponse } from "http";

export const mainRoute = (_req: IncomingMessage, res: ServerResponse) => {
  console.debug("Error 404: Non valid route");
  res.statusCode = 404;
  res.write("Non valid route");
  res.end();
};
