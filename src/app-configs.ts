import { SchedulerConfigs } from "@ldb/scheduler";
import { NodeOptions } from "@sc-logger/sentry";
import { SkynexConfigs } from "@sc-logger/skynex";
import { SERVICE_VERSION } from "./service-version";
import { PushGatewayConfigs } from "./types/push-gateway-configs";

const db = {
    credential: "lmn_backend:LmnBackend",
    server: "10.10.50.12:39100,10.10.50.13:39100,10.10.50.14:39100",
    replSet: "L1Local",
};
const appName = encodeURI("Randomness Exporter DevMode");

const environment = "LOCAL-DEV";
const service = "randomness-exporter";

export const eventConfigs: SchedulerConfigs = {
    CALCULATE: 60_000,
    PUSH: [60_000, 30_000],
};

export const promPushGatewayConfigs: PushGatewayConfigs = {
    baseURL: `http://10.10.50.14:9091`,
    options: {
        timeout: 5_000,
        agentOptions: {
            keepAlive: true,
            keepAliveMsecs: 10_000,
            maxSockets: 10,
        },
    },
    parameters: { jobName: service, groupings: { instance: environment } },
};

export const sentryOptions: NodeOptions = {
    dsn: "https://098a0c6ad1d74e8eb39ec7df895e59e0@sentry.lumigame.com/76",
    environment,
    initialScope: {
        tags: { service },
    },
    release: `${service}-service@${SERVICE_VERSION}`,
};

export const skynexOptions: SkynexConfigs = {
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    environment,
    conversationIds: { NotiChannel: -1001911631568 },
};

export const hostingPort = 5000;

export const database = {
    url: `mongodb://${db.credential}@${db.server}/admin?authSource=admin&appName=${appName}&replicaSet=${db.replSet}`,
};
