import { hostingPort } from "./app-configs";
import { HealthCheckServer } from "./healthcheck-server";
import { logger } from "./loggers";
import { SERVICE_VERSION } from "./service-version";

(async () => {
    const server = new HealthCheckServer(hostingPort);
    if (!server.server.listening) {
        logger.logError("HealthCheckServer", "HealthCheckServer is unhealthy", { hostingPort });
    }

    logger.logInfo("", `Randomness Exporter Service v${SERVICE_VERSION} has been started!`, false);
})();
