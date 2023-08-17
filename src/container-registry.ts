import { Scheduler, SchedulerConfigs } from "@ldb/scheduler";
import { AwilixContainer, InjectionMode, ResolveOptions, asClass, asValue, createContainer } from "awilix";
import { Agent } from "http";
import { ChangeStreamNameSpace, MongoClient } from "mongodb";
import { register } from "prom-client";
import { BaucuaMetricUpdater, TaixiuMetricUpdater, TxturboMetricUpdater, VipfishprawncrabMetricUpdater, VipsedieMetricUpdater, XocxocMetricUpdater } from "./game-metric-updaters";
import { GatewayAPI, GatewayOptions, MetricGateway } from "./modules/metric-gateway";
import { Monitor } from "./monitor";
import { PushGatewayConfigs } from "./types/push-gateway-configs";

export class ContainerRegistry {
    private readonly container: AwilixContainer;

    constructor(defaultInjectionMode: typeof InjectionMode.CLASSIC = InjectionMode.CLASSIC) {
        this.container = createContainer({ injectionMode: defaultInjectionMode });
    }

    register(mongoClient: MongoClient): this {
        this.container.register({
            mongoClient: asValue(mongoClient),
        });

        this.registerClasses();
        this.registerMetricUpdaters();
        this.registerEnv();

        return this;
    }

    registerScheduler(eventConfigs: SchedulerConfigs): this {
        this.container.register({
            scheduler: asClass(Scheduler).singleton(),
            eventConfigs: asValue(eventConfigs),
        });

        return this;
    }

    registerNamespaces(namespaces: Record<string, ChangeStreamNameSpace>): this {
        const mongoClient: MongoClient = this.container.resolve("mongoClient");

        for (const [name, namespace] of Object.entries(namespaces)) {
            const { db, coll } = namespace;
            this.container.register({
                [name]: asValue(mongoClient.db(db).collection(coll)),
            });
        }

        return this;
    }

    private registerClasses(): this {
        this.container.register({
            monitor: asClass(Monitor).singleton(),
        });

        return this;
    }

    private registerMetricUpdaters(): this {
        this.container.register({
            xocxocMetricUpdater: asClass(XocxocMetricUpdater).singleton(),
            vipsedieMetricUpdater: asClass(VipsedieMetricUpdater).singleton(),

            taixiuMetricUpdater: asClass(TaixiuMetricUpdater).singleton(),
            txturboMetricUpdater: asClass(TxturboMetricUpdater).singleton(),

            baucuaMetricUpdater: asClass(BaucuaMetricUpdater).singleton(),
            vipfishprawncrabMetricUpdater: asClass(VipfishprawncrabMetricUpdater).singleton(),
        });

        return this;
    }

    private registerEnv(): this {
        const { NODE_ENV: nodeEnv = "DEVELOPMENT" } = process.env;

        this.container.register({
            nodeEnv: asValue(nodeEnv),
        });

        return this;
    }

    registerPushGateway(pushGatewayConfigs: PushGatewayConfigs) {
        const {
            baseURL,
            options: { timeout, agentOptions },
            parameters,
        } = pushGatewayConfigs;
        const agent = new Agent(agentOptions);

        this.container.register({
            metricGateway: asClass(MetricGateway).singleton(),
            gatewayAPI: asClass(GatewayAPI).singleton(),
            gatewayURL: asValue(baseURL),
            gatewayOptions: asValue<GatewayOptions>({ timeout, agent }),
            registry: asValue(register),
            gatewayParameters: asValue(parameters),
        });

        return this;
    }

    resolve(name: string, resolveOptions?: ResolveOptions) {
        return this.container.resolve(name, resolveOptions);
    }
}
