import { Scheduler } from "@ldb/scheduler";
import { Agent } from "http";
import { Pushgateway, Registry } from "prom-client";
import { logger } from "../loggers";

export type GatewayOptions = {
    timeout: number;
    agent: Agent;
};

export class GatewayAPI extends Pushgateway {
    constructor(gatewayURL: string, gatewayOptions: GatewayOptions) {
        super(gatewayURL, gatewayOptions);
    }
}

export class MetricGateway {
    private readonly schedulers: Set<Scheduler> = new Set();

    constructor(private readonly gatewayAPI: Pushgateway, private readonly registry: Registry, private readonly gatewayParameters: Pushgateway.Parameters) {
        this.selfBound();
    }

    private get className() {
        return "MetricGateway";
    }

    private selfBound() {
        this.push = this.push.bind(this);
    }

    async push() {
        await this.gatewayAPI.pushAdd(this.gatewayParameters);
    }

    subscribe(scheduler: Scheduler): boolean {
        if (this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.schedulers.add(scheduler);
        scheduler.addListener("PUSH", this.push);
        return true;
    }

    unsubscribe(scheduler: Scheduler): boolean {
        if (!this.schedulers.has(scheduler)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        scheduler.removeListener("PUSH", this.push);
        this.schedulers.delete(scheduler);
        return true;
    }
}
