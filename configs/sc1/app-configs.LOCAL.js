import { SERVICE_VERSION } from "./service-version";

const db = {
    credential: "lmn_backend:LmnBackend",
    server: "10.10.50.12:39100,10.10.50.13:39100,10.10.50.14:39100",
    replSet: "L1Local",
};
const appName = encodeURI("Randomness Exporter DevMode");

const environment = "LOCAL-DEV";

export const sentryOptions = {
    dsn: "https://098a0c6ad1d74e8eb39ec7df895e59e0@sentry.lumigame.com/76",
    environment,
    initialScope: {
        tags: { service: "randomness-exporter" },
    },
    release: `randomness-exporter-service@${SERVICE_VERSION}`,
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
