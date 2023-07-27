import { Scheduler } from "@ldb/scheduler";
import { waitMs } from "@ldb/utils";
import { logger, terminal } from "./loggers";
import { MetricUpdater } from "./modules";

export class Monitor {
    constructor(
        private readonly nodeEnv: string,
        private readonly scheduler: Scheduler,
        private readonly xocxocMetricUpdater: MetricUpdater,
        private readonly vipsedieMetricUpdater: MetricUpdater,
        private readonly taixiuMetricUpdater: MetricUpdater,
        private readonly txturboMetricUpdater: MetricUpdater,
        private readonly baucuaMetricUpdater: MetricUpdater,
        private readonly vipfishprawncrabMetricUpdater: MetricUpdater
    ) {
        this.nodeEnv = nodeEnv;
        this.scheduler = scheduler;
        this.taixiuMetricUpdater = taixiuMetricUpdater;

        this.reportUnhandleErrors();
    }

    reportUnhandleErrors() {
        process.addListener("uncaughtException", async (...args) => await this.handleUncaughtException(...args));
        process.addListener("unhandledRejection", async (...args) => await this.handleUnhandledRejection(...args));
    }
    private async handleUncaughtException(error: Error, origin: NodeJS.UncaughtExceptionOrigin) {
        logger.logError(origin, error);

        await waitMs(5000);
        process.exit(10);
    }
    private async handleUnhandledRejection(reason: unknown, promise: Promise<unknown>) {
        logger.logError("unhandledRejection", reason, { promise });

        await waitMs(5000);
        process.exit(20);
    }

    async run() {
        this.xocxocMetricUpdater.subscribe(this.scheduler);
        this.vipsedieMetricUpdater.subscribe(this.scheduler);
        this.taixiuMetricUpdater.subscribe(this.scheduler);
        this.txturboMetricUpdater.subscribe(this.scheduler);
        this.baucuaMetricUpdater.subscribe(this.scheduler);
        this.vipfishprawncrabMetricUpdater.subscribe(this.scheduler);

        if (this.nodeEnv === "DEVELOPMENT") {
            this.scheduler.emit(Scheduler.FIRE, "");
        }
        terminal.logInfo("The monitor has run!");
    }
}
