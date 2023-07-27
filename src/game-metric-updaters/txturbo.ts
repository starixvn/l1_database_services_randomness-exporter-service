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
                pipeline: [
                    { $match: { $expr: { $gt: ["$id", "$$lastRound"] } } },
                    { $project: { _id: 0, id: 1, result: 1, settlementResult: 1 } },
                ],
                as: "data",
            },
        },
        { $unwind: "$data" },
        { $replaceWith: "$data" },
        {
            $group: {
                _id: "",
                lastRound: { $max: "$id" },

                dice1_1: { $sum: { $cond: [{ $eq: ["$result.dice1", 1] }, 1, 0] } },
                dice1_2: { $sum: { $cond: [{ $eq: ["$result.dice1", 2] }, 1, 0] } },
                dice1_3: { $sum: { $cond: [{ $eq: ["$result.dice1", 3] }, 1, 0] } },
                dice1_4: { $sum: { $cond: [{ $eq: ["$result.dice1", 4] }, 1, 0] } },
                dice1_5: { $sum: { $cond: [{ $eq: ["$result.dice1", 5] }, 1, 0] } },
                dice1_6: { $sum: { $cond: [{ $eq: ["$result.dice1", 6] }, 1, 0] } },

                dice2_1: { $sum: { $cond: [{ $eq: ["$result.dice2", 1] }, 1, 0] } },
                dice2_2: { $sum: { $cond: [{ $eq: ["$result.dice2", 2] }, 1, 0] } },
                dice2_3: { $sum: { $cond: [{ $eq: ["$result.dice2", 3] }, 1, 0] } },
                dice2_4: { $sum: { $cond: [{ $eq: ["$result.dice2", 4] }, 1, 0] } },
                dice2_5: { $sum: { $cond: [{ $eq: ["$result.dice2", 5] }, 1, 0] } },
                dice2_6: { $sum: { $cond: [{ $eq: ["$result.dice2", 6] }, 1, 0] } },

                dice3_1: { $sum: { $cond: [{ $eq: ["$result.dice3", 1] }, 1, 0] } },
                dice3_2: { $sum: { $cond: [{ $eq: ["$result.dice3", 2] }, 1, 0] } },
                dice3_3: { $sum: { $cond: [{ $eq: ["$result.dice3", 3] }, 1, 0] } },
                dice3_4: { $sum: { $cond: [{ $eq: ["$result.dice3", 4] }, 1, 0] } },
                dice3_5: { $sum: { $cond: [{ $eq: ["$result.dice3", 5] }, 1, 0] } },
                dice3_6: { $sum: { $cond: [{ $eq: ["$result.dice3", 6] }, 1, 0] } },

                big: { $sum: { $toInt: "$settlementResult.big" } },
                small: { $sum: { $toInt: "$settlementResult.small" } },
            },
        },
        {
            $project: {
                _id: 0,
                metrics: [
                    { metadata: {}, metric: "lastRound", type: "gauge", value: "$lastRound" },

                    { metadata: { actor: "dice1" }, metric: "rand_1", type: "counter", value: "$dice1_1" },
                    { metadata: { actor: "dice1" }, metric: "rand_2", type: "counter", value: "$dice1_2" },
                    { metadata: { actor: "dice1" }, metric: "rand_3", type: "counter", value: "$dice1_3" },
                    { metadata: { actor: "dice1" }, metric: "rand_4", type: "counter", value: "$dice1_4" },
                    { metadata: { actor: "dice1" }, metric: "rand_5", type: "counter", value: "$dice1_5" },
                    { metadata: { actor: "dice1" }, metric: "rand_6", type: "counter", value: "$dice1_6" },

                    { metadata: { actor: "dice2" }, metric: "rand_1", type: "counter", value: "$dice2_1" },
                    { metadata: { actor: "dice2" }, metric: "rand_2", type: "counter", value: "$dice2_2" },
                    { metadata: { actor: "dice2" }, metric: "rand_3", type: "counter", value: "$dice2_3" },
                    { metadata: { actor: "dice2" }, metric: "rand_4", type: "counter", value: "$dice2_4" },
                    { metadata: { actor: "dice2" }, metric: "rand_5", type: "counter", value: "$dice2_5" },
                    { metadata: { actor: "dice2" }, metric: "rand_6", type: "counter", value: "$dice2_6" },

                    { metadata: { actor: "dice3" }, metric: "rand_1", type: "counter", value: "$dice3_1" },
                    { metadata: { actor: "dice3" }, metric: "rand_2", type: "counter", value: "$dice3_2" },
                    { metadata: { actor: "dice3" }, metric: "rand_3", type: "counter", value: "$dice3_3" },
                    { metadata: { actor: "dice3" }, metric: "rand_4", type: "counter", value: "$dice3_4" },
                    { metadata: { actor: "dice3" }, metric: "rand_5", type: "counter", value: "$dice3_5" },
                    { metadata: { actor: "dice3" }, metric: "rand_6", type: "counter", value: "$dice3_6" },

                    { metadata: {}, metric: "settle_big", type: "counter", value: "$big" },
                    { metadata: {}, metric: "settle_small", type: "counter", value: "$small" },
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

export class TxturboMetricUpdater extends MetricUpdater {
    constructor(protected txturboMetricCollection: Collection, protected txturboRoundCollection: Collection) {
        super(txturboMetricCollection, txturboRoundCollection, pipelineFactory);
    }
}
