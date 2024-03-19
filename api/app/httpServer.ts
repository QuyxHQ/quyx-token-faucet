import http from "http";
import createServer from "./create-server";

const app = createServer();

const httpServer = http.createServer(app);

export default httpServer;
