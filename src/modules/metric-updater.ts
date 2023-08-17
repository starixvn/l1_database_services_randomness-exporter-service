import { Scheduler } from "@ldb/scheduler";
import { AggregateOptions, Collection, Document } from "mongodb";
import { Counter, Gauge, Metric, register } from "prom-client";
import { logger } from "../loggers";
import { GameInfo, METRIC_LABELS, MetricData, MetricLabels } from "../types/metric-data";

export class MetricUpdater {
    private readonly schedulers: Set<Scheduler> = new Set();
    private readonly metrics: Map<string, Metric<MetricLabels>> = new Map();

    constructor(
        protected readonly metricCollection: Collection,
        protected readonly roundCollection: Collection,
        private readonly pipelineFactory: (...args: [string, string]) => Document[],
        private readonly gameInfo: GameInfo
    ) {
        this.selfBound();
    }

    protected selfBound() {
        this.execute = this.execute.bind(this);
    }

    protected get pipeline(): Document[] {
        return this.pipelineFactory(this.metricCollection.collectionName, this.roundCollection.collectionName);
    }

    protected get className(): string {
        return this.constructor.name;
    }
    async execute(): Promise<void> {
        const aggregateOptions: AggregateOptions = { retryWrites: true, allowDiskUse: true, comment: "" };

        try {
            await this.metricCollection.aggregate(this.pipeline, aggregateOptions).tryNext();
            await this.updateMetric();
        } catch (error: unknown) {
            this.handleAggregateError(error, "executeMergeAggregate");
        }
    }

    private async updateMetric() {
        const metricCursor = this.metricCollection.find<MetricData>({}, { projection: { _id: 0 } });
        for await (const metricData of metricCursor) {
            const { metric, metadata, type, value } = metricData;

            const labels = { ...this.gameInfo, ...metadata };

            if (type === "counter") {
                const prom: Counter = (register.getSingleMetric(metric) as Counter) ?? new Counter({ name: metric, help: metric, labelNames: METRIC_LABELS });
                prom.reset();
                prom.inc(labels, value);
            } else if (type === "gauge") {
                const prom: Gauge = (register.getSingleMetric(metric) as Gauge) ?? new Gauge({ name: metric, help: metric, labelNames: METRIC_LABELS });
                prom.set(labels, value);
            } else {
                throw new TypeError(`Invalid metric type ${type}`);
            }
        }
    }

    protected handleAggregateError(error: unknown, component: string): void {
        logger.logError(`${this.className}.${component}`, error);
    }

    subscribe(scheduler: Scheduler): boolean {
        if (this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.schedulers.add(scheduler);
        scheduler.addListener("CALCULATE", this.execute);
        return true;
    }

    unsubscribe(scheduler: Scheduler): boolean {
        if (!this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        scheduler.removeListener("CALCULATE", this.execute);
        this.schedulers.delete(scheduler);
        return true;
    }
}
