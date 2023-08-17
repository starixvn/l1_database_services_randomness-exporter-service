import { Document } from "bson";
import { Collection } from "mongodb";
import { MetricUpdater } from "../modules";

function pipelineFactory(metricCollectionName: string, roundCollectionName: string): Document[] {
    return [
        { $match: { metric: "lastRound" } },
        { $limit: 1 },
        { $project: { _id: 0, lastRound: "$value" } },
        {
            $lookup: {
                from: roundCollectionName,
                let: { lastRound: "$lastRound" },
                pipeline: [{ $match: { $expr: { $gt: ["$id", "$$lastRound"] } } }, { $project: { _id: 0, id: 1, result: 1, settlementResult: 1 } }],
                as: "data",
            },
        },
        { $unwind: "$data" },
        { $replaceWith: "$data" },
        {
            $group: {
                _id: "",
                lastRound: { $max: "$id" },

                coin1_red: { $sum: { $cond: ["$result.red1", 1, 0] } },
                coin1_white: { $sum: { $cond: ["$result.red1", 0, 1] } },

                coin2_red: { $sum: { $cond: ["$result.red2", 1, 0] } },
                coin2_white: { $sum: { $cond: ["$result.red2", 0, 1] } },

                coin3_red: { $sum: { $cond: ["$result.red3", 1, 0] } },
                coin3_white: { $sum: { $cond: ["$result.red3", 0, 1] } },

                coin4_red: { $sum: { $cond: ["$result.red4", 1, 0] } },
                coin4_white: { $sum: { $cond: ["$result.red4", 0, 1] } },

                odd: { $sum: { $toInt: "$settlementResult.odd" } },
                even: { $sum: { $toInt: "$settlementResult.even" } },

                "0red": { $sum: { $toInt: "$settlementResult.white4" } },
                "1red": { $sum: { $toInt: "$settlementResult.white3" } },
                "2red": { $sum: { $toInt: "$settlementResult.red2" } },
                "3red": { $sum: { $toInt: "$settlementResult.red3" } },
                "4red": { $sum: { $toInt: "$settlementResult.red4" } },
            },
        },
        {
            $project: {
                _id: 0,
                metrics: [
                    { metadata: {}, metric: "lastRound", type: "gauge", value: "$lastRound" },

                    { metadata: { actor: "coin1" }, metric: "rand_red", type: "counter", value: "$coin1_red" },
                    { metadata: { actor: "coin1" }, metric: "rand_white", type: "counter", value: "$coin1_white" },

                    { metadata: { actor: "coin2" }, metric: "rand_red", type: "counter", value: "$coin2_red" },
                    { metadata: { actor: "coin2" }, metric: "rand_white", type: "counter", value: "$coin2_white" },

                    { metadata: { actor: "coin3" }, metric: "rand_red", type: "counter", value: "$coin3_red" },
                    { metadata: { actor: "coin3" }, metric: "rand_white", type: "counter", value: "$coin3_white" },

                    { metadata: { actor: "coin4" }, metric: "rand_red", type: "counter", value: "$coin4_red" },
                    { metadata: { actor: "coin4" }, metric: "rand_white", type: "counter", value: "$coin4_white" },

                    { metadata: {}, metric: "settle_odd", type: "counter", value: "$odd" },
                    { metadata: {}, metric: "settle_even", type: "counter", value: "$even" },

                    { metadata: {}, metric: "settle_0red", type: "counter", value: "$0red" },
                    { metadata: {}, metric: "settle_1red", type: "counter", value: "$1red" },
                    { metadata: {}, metric: "settle_2red", type: "counter", value: "$2red" },
                    { metadata: {}, metric: "settle_3red", type: "counter", value: "$3red" },
                    { metadata: {}, metric: "settle_4red", type: "counter", value: "$4red" },
                ],
            },
        },
        { $unwind: "$metrics" },
        { $replaceWith: "$metrics" },
        {
            $lookup: {
                from: metricCollectionName,
                let: { metric: "$metric", metadata: "$metadata" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$metric", "$$metric"] }, { $eq: ["$metadata", "$$metadata"] }] } } },
                    { $project: { _id: 0, type: 1, value: 1 } },
                    { $limit: 1 },
                ],
                as: "prev",
            },
        },
        {
            $unwind: {
                path: "$prev",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $set: {
                prev: "$$REMOVE",
                value: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$type", "counter"] }, then: { $add: ["$value", { $ifNull: ["$prev.value", 0] }] } },
                            { case: { $eq: ["$type", "gauge"] }, then: { $ifNull: ["$value", { $ifNull: ["$prev.value", 0] }] } },
                        ],
                        default: { $ifNull: ["$value", { $ifNull: ["$prev.value", 0] }] },
                    },
                },
            },
        },
        {
            $merge: {
                into: metricCollectionName,
                on: ["metric", "metadata"],
            },
        },
    ];
}

export class XocxocMetricUpdater extends MetricUpdater {
    constructor(xocxocMetricCollection: Collection, xocxocRoundCollection: Collection) {
        super(xocxocMetricCollection, xocxocRoundCollection, pipelineFactory, { game_id: 2, game_name: "xocxoc" });
    }
}
