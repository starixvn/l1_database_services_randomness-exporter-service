import { SERVICE_VERSION } from "./service-version";

const db = {
    credential: "lmn_backend:LmnBackend",
    server: "10.10.50.12:39103,10.10.50.13:39103,10.10.50.14:39103",
    replSet: "L1pppLocal",
};
const appName = encodeURI("Randomness Exporter Service");

const environment = "LOCAL-3";
const service = "randomness-exporter";

export const eventConfigs = {
    CALCULATE: 60_000,
    PUSH: [60_000, 30_000],
};

export const promPushGatewayConfigs = {
    baseURL: `http://10.10.50.14:9091`,
    options: {
        timeout: 5_000,
        agentOptions: {
            keepAlive: true,
            keepAliveMsecs: 10_000,
            maxSockets: 10,
        },
    },
    parameters: { jobName: service, groupings: { instance: `SC-${environment}` } },
};

export const sentryOptions = {
    dsn: "https://098a0c6ad1d74e8eb39ec7df895e59e0@sentry.lumigame.com/76",
    environment,
    initialScope: {
        tags: { service },
    },
    release: `${service}-service@${SERVICE_VERSION}`,
};

export const skynexOptions = {
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    environment,
    conversationIds: { NotiChannel: -1001964283718 },
};

export const hostingPort = 5000;

export const database = {
    url: `mongodb://${db.credential}@${db.server}/admin?authSource=admin&appName=${appName}&replicaSet=${db.replSet}`,
};
