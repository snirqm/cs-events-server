import { IncomingMessage, ServerResponse } from "http";
import { protectedRoute, validatePermissionLevel } from "./auth.js";
import { CATAGORY_SELECTOR, LIMIT_DEFAULT, SKIP_DEFAULT, VALID_CATEGORIES, isError } from "./const.js";
import url from "url";
import { responseError, responseJSON, responseSuccess } from "./response.js";
import { Event } from "./db.js";
import { routeWithData } from "./request.js";
import { validateEvent } from "./schema.js";
export const getEventRoute = (req: IncomingMessage, res: ServerResponse) => {
    console.debug("Got GET event request: ", req.url);
    const user = protectedRoute(req, res);
    if (isError(user)) {
        return;
    }
    const url_obj = url.parse(req.url, true);
    const id = url_obj.pathname.split("/").pop();
    console.debug("Searching for event with id:", id);
    Event.findById(id, (err, event) => {
        if (err) {
            console.error("Failed to find event: ", err);
            return responseError(res, 500, "Failed to find event.");
        }
        if (!event) {
            console.debug("Event not found with id: ", id);
            return responseError(res, 404, "Event not found.");
        }
        console.debug("Found event: ", event);
        responseJSON(res, event);
    });
    console.debug("End of GET event request: ", req.url);
}

export const putEventRoute = async (req: IncomingMessage, res: ServerResponse) => {
    const user = protectedRoute(req, res);
    if (isError(user)) {
        return;
    }
    validatePermissionLevel(user.value, "M").then((valid) => {
        if (!valid) {
            return responseError(res, 403, "You are not authorized to update events.");
        }
        const url_obj = url.parse(req.url, true);
        const id = url_obj.pathname.split("/").pop();
        const data = { body: "" };
        routeWithData(req, res, data, () => {
            if (data.body.length === 0) {
                return responseError(res, 400, "Bad request.");
            }
            const event = JSON.parse(data.body);
            Event.findOneAndUpdate({ _id: id }, event, (err, event) => {
                if (err) {
                    console.error("Failed to update event: ", err);
                    return responseError(res, 500, "Failed to update event.");
                }
                if (!event) {
                    return responseError(res, 404, "Event not found.");
                }
                return responseJSON(res, { _id: event._id.toString() });
            });
        });
    });
}

export const postEventRoute = async (req: IncomingMessage, res: ServerResponse) => {
    const user = protectedRoute(req, res);
    if (isError(user)) {
        return;
    }
    validatePermissionLevel(user.value, "M").then((valid) => {
        if (!valid) {
            return responseError(res, 401, "You are not authorized to create events.");
        }
        const data = { body: "" };
        routeWithData(req, res, data, () => {
            if (data.body.length === 0) {
                return responseError(res, 400, "Bad request.");
            }
            const { value: event, error } = validateEvent(JSON.parse(data.body));
            if (error) {
                console.error("Failed to validate event: ", error);
                return responseError(res, 400, "Bad request: " + error.details[0].message);
            }
            Event.create(event, (err, event) => {
                if (err) {
                    console.error("Failed to create event: ", err);
                    return responseError(res, 500, "Failed to create event.");
                }
                console.debug("Created event: ", event._id.toString());
                return responseJSON(res, { _id: event._id.toString() });
            });
        });
    });
}

export const deleteEventRoute = async (req: IncomingMessage, res: ServerResponse) => {
    const user = protectedRoute(req, res);
    if (isError(user)) {
        return;
    }
    validatePermissionLevel(user.value, "A").then((valid) => {
        if (!valid) {
            return responseError(res, 403, "You are not authorized to delete events.");
        }
        console.debug("Deleting event");
        const url_obj = url.parse(req.url, true);
        const id = url_obj.pathname.split("/").pop();
            Event.findOneAndDelete({ _id: id }, (err, event) => {
                if (err) {
                    console.error("Failed to delete event: ", err);
                    return responseError(res, 500, "Failed to delete event.");
                }
                if (!event) {
                    return responseError(res, 404, "Event not found.");
                }
                return responseJSON(res, {});
            });
    });
}

const validateSelector = (req: IncomingMessage, selector: string) => {
    if (selector === CATAGORY_SELECTOR) {
        const url_obj = url.parse(req.url, true);
        const catagory = decodeURI(url_obj.pathname.split("/").pop());
        return VALID_CATEGORIES.map(c => String(c)).includes(catagory);
    }
    return true;
}

export const getByRoute = (req: IncomingMessage, res: ServerResponse, selector: string) => {
    if (!validateSelector(req, selector)) {
        return responseError(res, 404, "Bad request for " + selector + ".");
    }
    const user = protectedRoute(req, res);
    if (isError(user)) {
        return;
    }
    const url_obj = url.parse(req.url, true);
    const id = decodeURI(url_obj.pathname.split("/").pop());
    console.debug("Searching for ", selector, " with id: ", id)
    const skip = url_obj.query.skip ? parseInt(url_obj.query.skip as string) : SKIP_DEFAULT;
    const limit = url_obj.query.limit ? parseInt(url_obj.query.limit as string) : LIMIT_DEFAULT;
        Event.find({ [selector]: id }, (err, events) => {
            if (err) {
                console.error("Failed to find events: ", err);
                return responseError(res, 500, "Failed to find events.");
            }
            if (events.length === 0) {
                console.debug("Events not found with ", selector, " id: ", id);
                return responseError(res, 404, "Events not found with " + selector + " id: " + id);
            }
            return responseJSON(res, events);
        }).skip(skip).limit(limit < LIMIT_DEFAULT ? limit : LIMIT_DEFAULT);
}