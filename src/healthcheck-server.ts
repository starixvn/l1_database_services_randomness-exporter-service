import { stringify } from "@ldb/utils";
import { TerminalLogger } from "@sc-logger/terminal";
import http, { IncomingMessage, Server, ServerResponse } from "http";
import { RequestOptions } from "https";

const terminal = new TerminalLogger();

export class HealthCheckServer {
    readonly server: Server;
    private readonly port: number;

    static requestHealthCheck(options: RequestOptions) {
        const httpRequest = http.request(options, HealthCheckServer.handleHealthCheckResponse);

        httpRequest.on("error", HealthCheckServer.handleHealthCheckError);

        httpRequest.end();
    }

    private static handleHealthCheckResponse(res: IncomingMessage) {
        const { statusCode } = res;

        terminal.logInfo("", { title: "STATUS", subject: stringify(statusCode) });

        process.exitCode = statusCode === 200 ? 0 : 1;
        process.exit();
    }
    private static handleHealthCheckError(error: Error) {
        terminal.logError(error);
        process.exit(1);
    }

    constructor(port: number) {
        this.port = port;

        this.server = http.createServer();
        this.server.listen(this.port);
        this.server.on("listening", (...args) => this.handleListening(...args));
        this.server.on("request", (...args) => this.handleRequest(...args));
    }

    private handleListening() {
        terminal.logInfo("", { title: "HealthCheckServer", subject: `Server started on port ${this.port}!` });
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse) {
        res.end("Game Configs Monitor");
    }
}
