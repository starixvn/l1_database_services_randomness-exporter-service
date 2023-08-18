import { Satisfies } from "./type-utils";

export const METRIC_LABELS = ["actor", "game_id", "game_name"] as const;
export type MetricLabels = (typeof METRIC_LABELS)[number];

export type MetricType = "counter" | "gauge" | "histogram" | "summary";

export type MetricData = {
    metadata: MetricMetadata;
    metric: string;
    type: MetricType;
    value: number;
};

export type GameInfo = {
    game_id: number;
    game_name: string;
};

export type MetricMetadata = Satisfies<
    GameInfo & {
        actor: string;
    },
    Record<MetricLabels, string | number>
>;
