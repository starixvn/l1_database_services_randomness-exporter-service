import { Scheduler } from "@ldb/scheduler";
import { AggregateOptions, Collection, Document } from "mongodb";
import { logger } from "../loggers";

export class MetricUpdater {
    private readonly schedulers: Set<Scheduler> = new Set();

    constructor(
        protected metricCollection: Collection,
        protected roundCollection: Collection,
        private pipelineFactory: (...args: [string, string]) => Document[]
    ) {
        this.metricCollection = metricCollection;
        this.roundCollection = roundCollection;
        this.pipelineFactory = pipelineFactory;

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

    setPipelineFactory(pipelineFactory: (...args: [string, string]) => Document[]): this {
        this.pipelineFactory = pipelineFactory;
        return this;
    }

    async execute(): Promise<void> {
        const aggregateOptions: AggregateOptions = {
            retryWrites: true,
            allowDiskUse: true,
            comment: "",
        };

        try {
            await this.metricCollection.aggregate(this.pipeline, aggregateOptions).tryNext();
        } catch (error: unknown) {
            this.handleAggregateError(error, "executeMergeAggregate");
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
        scheduler.addListener(Scheduler.FIRE, this.execute);
        return true;
    }

    unsubscribe(scheduler: Scheduler): boolean {
        if (!this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        scheduler.addListener(Scheduler.FIRE, this.execute);
        this.schedulers.delete(scheduler);
        return true;
    }
}
