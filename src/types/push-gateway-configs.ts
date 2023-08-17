import { AgentOptions } from "http";
import { Pushgateway } from "prom-client";

export type PushGatewayConfigs = {
    baseURL: string;
    options: {
        timeout: number;
        agentOptions: AgentOptions;
    };
    parameters: Pushgateway.Parameters;
};
