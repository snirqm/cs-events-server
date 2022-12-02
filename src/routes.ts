import { IncomingMessage, ServerResponse } from "http";

const exampleData = {
  title: "This is nice example",
  subtitle: "Good Luck! :)",
};

export const mainRoute = (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write("<h1>Hello Yedidi</h1>");
  res.end();
};

export const getExample = (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json"); // Status & header
  res.write(JSON.stringify(exampleData)); // build in js function, to convert json to a string
  res.end();
};
