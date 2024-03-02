import { ServerResponse } from "http";

export const responseError: (res: ServerResponse, statusCode: number, message: string) => { error: number, message: string } = (res, statusCode, message) => {
    res.statusCode = statusCode;
    res.end(
        JSON.stringify({
            message: message,
        })
    );
    return { error: statusCode, message: message };
}

export const responseSuccess = (res: ServerResponse, statusCode: number, body: any) => {
    res.statusCode = statusCode;
    res.end(
        JSON.stringify(body)
    );
    return;
}

export const responseJSON = (res: ServerResponse, body: any) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify(body)
    );
    return;
}