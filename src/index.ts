import { createServer } from "http";
import { router } from "./routes.js";

const port = process.env.PORT || 3000;
const server = createServer(router);

server.listen(port);
console.log(`Server running! port ${port}`);
