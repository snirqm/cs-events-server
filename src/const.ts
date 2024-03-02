export type ValueOrError<T> = { value: T } | { error: number, message: string};
export const isValue = <T>(valueOrError: ValueOrError<T>): valueOrError is { value: T } => {
    return (valueOrError as { value: T }).value !== undefined;
}
export const isError = <T>(valueOrError: ValueOrError<T>): valueOrError is { error: number, message: string} => {
    return (valueOrError as { error: number, message: string }).error !== undefined;
}
export const EVENT_ID_TEMPLATE = "/api/event/{id}";
export const EVENT_CATAGORY_TEMPLATE = "/api/event/{catagory}";
export const EVENT_ORGANIZER_TEMPLATE = "/api/event/organizer/{id}";

export const PUT_PERMISSIONS = "PUT /api/permissions";
export const POST_LOGIN = "POST /api/login";
export const POST_SIGNUP = "POST /api/signup";
export const GET_EVENT = `GET ${EVENT_ID_TEMPLATE}`;
export const PUT_EVENT = `PUT ${EVENT_ID_TEMPLATE}`;
export const DELETE_EVENT = `DELETE ${EVENT_ID_TEMPLATE}`;
export const GET_CATAGORY = `GET ${EVENT_CATAGORY_TEMPLATE}`;
export const GET_ORGANIZER = `GET ${EVENT_ORGANIZER_TEMPLATE}`;
export const POST_EVENT = "POST /api/event";

export const LIMIT_DEFAULT = 50;
export const SKIP_DEFAULT = 0;

export const MONOGODB_URI = "mongodb+srv://snir:164729583@cs-events-db.fohsvk2.mongodb.net/?retryWrites=true&w=majority&appName=cs-events-db" 


export const VALID_CATEGORIES = [
    "Charity Event", "Concert", "Conference", "Convention", "Exhibition", "Festival",
    "Product Launch", "Sports Event"
] as const;

export const CATAGORY_SELECTOR = "category";
export const ORGANIZER_SELECTOR = "organizer";