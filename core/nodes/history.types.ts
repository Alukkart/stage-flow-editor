import {StageFlowNode} from "@/core/nodes/node.types";
import type { Edge } from '@xyflow/react';

export type FlowSnapshot = {
    nodes: StageFlowNode[];
    edges: Edge[];
};

export type HistoryState = {
    past: FlowSnapshot[];
    future: FlowSnapshot[];
};
