import { ChangeStreamNameSpace } from "mongodb";

export const namespaces: Record<string, ChangeStreamNameSpace> = {
    xocxocMetricCollection: { db: "minigame", coll: "xocxoc_metrics" },
    xocxocRoundCollection: { db: "minigame", coll: "xocxoc_phiens" },

    vipsedieMetricCollection: { db: "minigame", coll: "vipsedie_metrics" },
    vipsedieRoundCollection: { db: "minigame", coll: "vipsedie_phiens" },

    taixiuMetricCollection: { db: "minigame", coll: "taixiu_metrics" },
    taixiuRoundCollection: { db: "minigame", coll: "taixiu_phiens" },

    txturboMetricCollection: { db: "minigame", coll: "txturbo_metrics" },
    txturboRoundCollection: { db: "minigame", coll: "txturbo_phiens" },

    baucuaMetricCollection: { db: "minigame", coll: "baucua_metrics" },
    baucuaRoundCollection: { db: "minigame", coll: "baucua_phiens" },

    vipfishprawncrabMetricCollection: { db: "minigame", coll: "vipfishprawncrab_metrics" },
    vipfishprawncrabRoundCollection: { db: "minigame", coll: "vipfishprawncrab_phiens" },
};
