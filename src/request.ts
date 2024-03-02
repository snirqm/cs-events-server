import { IncomingMessage, ServerResponse } from "http";
import { responseError } from "./response.js";

export const routeWithData = (req: IncomingMessage, res: ServerResponse, data: { 'body': string }, callback: () => void) => {
    req.on("data", (chunk) => {
      data.body += chunk.toString();
    });
    req.on("end", async () => {
      if (data.body.length === 0) {
        return responseError(res, 400, "Bad request.");
      }
      await callback();
    });
  }