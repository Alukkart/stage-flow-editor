import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {StageNode} from "@/core/nodes/stageNode";
import {DataEdge} from "@/core/edges/dataEdge";
import {OrderEdge} from "@/core/edges/orderEdge";

export const GRAPH_STORAGE_KEY = "stage-flow-editor.graph";

type SerializedNode = {
    id: string;
    type: string;
    position: {x: number; y: number};
    data: Record<string, unknown>;
};

type SerializedEdge = {
    id: string;
    type: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    data?: Record<string, unknown>;
};

export type SerializedGraph = {
    nodes: SerializedNode[];
    edges: SerializedEdge[];
};

export const serializeGraph = (nodes: BaseNode[], edges: BaseEdge[]): SerializedGraph => ({
    nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
    })),
    edges: edges.map((edge) => ({
        id: edge.id,
        type: edge.type,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        data: edge.data,
    })),
});

export const deserializeGraph = (graph: SerializedGraph) => {
    const nodes: BaseNode[] = [];
    graph.nodes.forEach((node) => {
        if (node.type === "inputsNode") {
            nodes.push(new InputsNode(node.id, node.position, node.data as InputsNode["data"]));
            return;
        }

        if (node.type === "parallelNode") {
            nodes.push(new ParallelNode(node.id, node.position, node.data as ParallelNode["data"]));
            return;
        }

        if (node.type === "stageNode") {
            nodes.push(new StageNode(node.id, node.position, node.data as StageNode["data"]));
        }
    });

    const edges: BaseEdge[] = [];
    graph.edges.forEach((edge) => {
        if (edge.type === "orderEdge") {
            edges.push(
                new OrderEdge(edge.id, edge.source, edge.target, edge.sourceHandle, edge.targetHandle, edge.data ?? {})
            );
            return;
        }

        if (edge.type === "dataEdge") {
            edges.push(
                new DataEdge(edge.id, edge.source, edge.target, edge.sourceHandle, edge.targetHandle, edge.data ?? {})
            );
        }
    });

    return {nodes, edges};
};
