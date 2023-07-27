import { Scheduler, SchedulerConfigs } from "@ldb/scheduler";
import { AwilixContainer, InjectionMode, ResolveOptions, asClass, asValue, createContainer } from "awilix";
import { ChangeStreamNameSpace, MongoClient } from "mongodb";
import {
    BaucuaMetricUpdater,
    TaixiuMetricUpdater,
    TxturboMetricUpdater,
    VipfishprawncrabMetricUpdater,
    VipsedieMetricUpdater,
    XocxocMetricUpdater,
} from "./game-metric-updaters";
import { Monitor } from "./monitor";

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
        const { NODE_ENV: nodeEnv } = process.env;

        this.container.register({
            nodeEnv: asValue(nodeEnv || "DEVELOPMENT"),
        });

        return this;
    }

    resolve(name: string, resolveOptions?: ResolveOptions) {
        return this.container.resolve(name, resolveOptions);
    }
}
