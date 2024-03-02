
// import with .js, and not ts.
// for more info: https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#type-in-package-json-and-new-extensions
import { POST_LOGIN, PUT_PERMISSIONS, POST_SIGNUP, GET_EVENT, DELETE_EVENT, PUT_EVENT, GET_CATAGORY, GET_ORGANIZER, POST_EVENT, CATAGORY_SELECTOR, ORGANIZER_SELECTOR } from "./const.js";
import { loginRoute, signupRoute, permissionsRoute } from "./auth.js";
import { deleteEventRoute, getByRoute, getEventRoute, postEventRoute, putEventRoute } from "./event.js";
import { IncomingMessage, ServerResponse } from "http";
import { EVENT_CATAGORY_TEMPLATE, EVENT_ID_TEMPLATE, EVENT_ORGANIZER_TEMPLATE } from "./const.js";
import url from "url";
import { mainRoute } from "./main.js";

const createRoute = (url_string: string, method: string) => {
  const url_obj = url.parse(url_string, true);
  const event_regex = /\/api\/event\/[0-9a-fA-F]{24}$/;
  const catagory_regex = /\/api\/event\/\w+\s*\w*/;
  const organizer_regex = /\/api\/event\/organizer\/\w+\s*\w*/;
  if (organizer_regex.test(url_obj.pathname)) {
    return `${method} ${EVENT_ORGANIZER_TEMPLATE}`;
  }
  if (event_regex.test(url_obj.pathname)) {
    return `${method} ${EVENT_ID_TEMPLATE}`;
  }
  if (catagory_regex.test(url_obj.pathname)) {
    return `${method} ${EVENT_CATAGORY_TEMPLATE}`;
  }
  return `${method} ${url_obj.pathname}`;
};

const getRouteCallback = (route: string) => {
  switch (route) {
    case PUT_PERMISSIONS:
      return async (req: IncomingMessage, res: ServerResponse) => await permissionsRoute(req, res);
    case POST_LOGIN:
      return async (req: IncomingMessage, res: ServerResponse) => await loginRoute(req, res);
    case POST_SIGNUP:
      return async (req: IncomingMessage, res: ServerResponse) => await signupRoute(req, res);
    case GET_EVENT:
      return async (req: IncomingMessage, res: ServerResponse) => await getEventRoute(req, res);
    case PUT_EVENT:
      return async (req: IncomingMessage, res: ServerResponse) => await putEventRoute(req, res);
    case POST_EVENT:
      return async (req: IncomingMessage, res: ServerResponse) => await postEventRoute(req, res);
    case DELETE_EVENT:
      return async (req: IncomingMessage, res: ServerResponse) => await deleteEventRoute(req, res);
    case GET_CATAGORY:
      return async (req: IncomingMessage, res: ServerResponse) => await getByRoute(req, res, CATAGORY_SELECTOR);
    case GET_ORGANIZER:
      return async (req: IncomingMessage, res: ServerResponse) => await getByRoute(req, res, ORGANIZER_SELECTOR);
    default:
      return async (req: IncomingMessage, res: ServerResponse) => await mainRoute(req, res);
  }
}

export const router = async (req: IncomingMessage, res: ServerResponse) => {
  const route = createRoute(req.url, req.method);
  console.debug("Created route: ", route);
  const routeCallback = getRouteCallback(route);
  await routeCallback(req, res);
  console.debug("Finished route: ", route);
}