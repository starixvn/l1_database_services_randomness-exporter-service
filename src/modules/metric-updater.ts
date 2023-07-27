import { AggregateOptions, Collection, Document } from "mongodb";
import { logger } from "../loggers";

export class MetricUpdater {
    constructor(
        protected metricCollection: Collection,
        protected roundCollection: Collection,
        private pipelineFactory: (...args: [string, string]) => Document[]
    ) {
        this.metricCollection = metricCollection;
        this.roundCollection = roundCollection;
        this.pipelineFactory = pipelineFactory;
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
            await this.metricCollection.aggregate(this.pipeline, aggregateOptions);
        } catch (error: unknown) {
            this.handleAggregateError(error, "executeMergeAggregate");
        }
    }

    protected handleAggregateError(error: unknown, component: string): void {
        logger.logError(`${this.className}.${component}`, error);
    }
}
