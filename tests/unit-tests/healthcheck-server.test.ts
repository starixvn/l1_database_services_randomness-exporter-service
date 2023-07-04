/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from "@jest/globals";
import { waitMs } from "@ldb/utils";
import { TerminalLogger } from "@sc-logger/terminal";
import { EventEmitter } from "events";
import http from "http";
import { HealthCheckServer } from "../../src/healthcheck-server";

afterEach(() => {
    jest.clearAllMocks();
});

jest.spyOn(TerminalLogger.prototype, "logError").mockImplementation(() => null);
jest.spyOn(TerminalLogger.prototype, "logInfo").mockImplementation(() => null);

describe("[static HealthCheckServer]", () => {
    describe("[static function handleHealthCheckResponse]", () => {
        it("Request status 200", () => {
            const spyExit = jest.spyOn(process, "exit").mockImplementation(() => null as never);
            (HealthCheckServer as any).handleHealthCheckResponse({ statusCode: 200 });

            expect(spyExit).toHaveBeenCalledTimes(1);
            expect(spyExit).toHaveBeenLastCalledWith();
            expect(process.exitCode).toEqual(0);
        });

        it("Request status not 200", () => {
            const spyExit = jest.spyOn(process, "exit").mockImplementation(() => null as never);
            (HealthCheckServer as any).handleHealthCheckResponse({ statusCode: 400 });

            expect(spyExit).toHaveBeenCalledTimes(1);
            expect(spyExit).toHaveBeenLastCalledWith();
            expect(process.exitCode).toEqual(1);
        });
    });

    describe("[static function handleHealthCheckError]", () => {
        it("Exit on ERROR", () => {
            const spyExit = jest.spyOn(process, "exit").mockImplementation(() => null as never);
            (HealthCheckServer as any).handleHealthCheckError({});

            expect(spyExit).toHaveBeenCalledTimes(1);
            expect(spyExit).toHaveBeenLastCalledWith(1);
        });
    });

    it("[static function requestHealthCheck]", () => {
        const mockOn = jest.fn();
        const mockEnd = jest.fn();
        const spyRequest = jest
            .spyOn(http, "request")
            .mockImplementation(() => Object.assign(new EventEmitter(), { on: mockOn, end: mockEnd }) as any);

        HealthCheckServer.requestHealthCheck({});
        expect(spyRequest).toHaveBeenCalledTimes(1);
        expect(spyRequest).toHaveBeenLastCalledWith({}, (HealthCheckServer as any).handleHealthCheckResponse);
        expect(mockOn).toHaveBeenCalledTimes(1);
        expect(mockOn).toHaveBeenLastCalledWith("error", (HealthCheckServer as any).handleHealthCheckError);
        expect(mockEnd).toHaveBeenCalledTimes(1);
        expect(mockEnd).toHaveBeenLastCalledWith();

        spyRequest.mockReset();
    });
});

describe("[class HealthCheckServer]", () => {
    const mockListen = jest.fn();
    const mockOn = jest.fn();

    it("Init sequence", () => {
        const spyCreateServer = jest
            .spyOn(http, "createServer")
            .mockImplementation(() => Object.assign(new EventEmitter(), { listen: mockListen, on: mockOn }) as any);

        const server = new HealthCheckServer(1234);

        expect((server as any).port).toEqual(1234);
        expect(spyCreateServer).toHaveBeenCalledTimes(1);
        expect(spyCreateServer).toHaveBeenLastCalledWith();
        expect(mockListen).toHaveBeenCalledTimes(1);
        expect(mockListen).toHaveBeenLastCalledWith(1234);
        expect(mockOn).toHaveBeenCalledTimes(2);
        expect(mockOn).toHaveBeenCalledWith("listening", expect.any(Function));
        expect(mockOn).toHaveBeenCalledWith("request", expect.any(Function));

        spyCreateServer.mockReset();
    });

    it("[function handleRequest]", async () => {
        const mockServer = new EventEmitter();
        const spyCreateServer = jest
            .spyOn(http, "createServer")
            .mockImplementation(() => Object.assign(mockServer, { listen: mockListen }) as any);

        const server = new HealthCheckServer(1234);
        const spyHandleListening = jest.spyOn(server as any, "handleListening");

        server.server.emit("listening");
        await waitMs(100);
        expect(spyHandleListening).toHaveBeenCalledTimes(1);

        spyCreateServer.mockReset();
    });

    it("[function handleRequest]", async () => {
        const spyCreateServer = jest
            .spyOn(http, "createServer")
            .mockImplementation(() => Object.assign(new EventEmitter(), { listen: mockListen }) as any);
        const server = new HealthCheckServer(1234);
        const mockEnd = jest.fn();
        const spyHandleRequest = jest.spyOn(server as any, "handleRequest");

        server.server.emit("request", {}, { end: mockEnd });
        await waitMs(100);
        expect(spyHandleRequest).toHaveBeenCalledTimes(1);
        expect(mockEnd).toHaveBeenCalledTimes(1);
        expect(mockEnd).toHaveBeenLastCalledWith("Game Configs Monitor");

        spyCreateServer.mockReset();
    });
});
