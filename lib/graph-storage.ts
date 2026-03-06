import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {StageNode} from "@/core/nodes/stageNode";
import {DataEdge} from "@/core/edges/dataEdge";
import {OrderEdge} from "@/core/edges/orderEdge";
import {ConditionNode} from "@/core/nodes/conditionNode";
import {TerminalNode} from "@/core/nodes/terminalNode";
import {EdgeLineStyle, EdgeStyleSettings} from "@/store/graph-store";

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
    className?: string;
    label?: string;
    style?: Record<string, unknown>;
    animated?: boolean;
    markerEnd?: BaseEdge["markerEnd"];
    hidden?: boolean;
};

export type SerializedGraph = {
    nodes: SerializedNode[];
    edges: SerializedEdge[];
    edgeStyleSettings?: EdgeStyleSettings;
};

const isValidLineStyle = (value: unknown): value is EdgeLineStyle =>
    value === "solid" || value === "dashed" || value === "dotted";

const isValidEdgeStyleSettings = (value: unknown): value is EdgeStyleSettings => {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    const keys = ["flow", "data", "input"] as const;

    return keys.every((key) => {
        const config = candidate[key];
        if (!config || typeof config !== "object") return false;

        const typed = config as Record<string, unknown>;
        return (
            typeof typed.visible === "boolean" &&
            typeof typed.color === "string" &&
            typeof typed.width === "number" &&
            isValidLineStyle(typed.style)
        );
    });
};

export const serializeGraph = (
    nodes: BaseNode[],
    edges: BaseEdge[],
    edgeStyleSettings?: EdgeStyleSettings,
): SerializedGraph => ({
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
        className: edge.className,
        label: edge.label,
        style: edge.style,
        animated: edge.animated,
        markerEnd: edge.markerEnd,
        hidden: edge.hidden,
    })),
    edgeStyleSettings,
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
            return;
        }

        if (node.type === "conditionNode") {
            nodes.push(new ConditionNode(node.id, node.position, node.data as ConditionNode["data"]));
            return;
        }

        if (node.type === "terminalNode") {
            nodes.push(new TerminalNode(node.id, node.position, node.data as TerminalNode["data"]));
        }
    });

    const edges: BaseEdge[] = [];
    graph.edges.forEach((edge) => {
        if (edge.type === "orderEdge") {
            const restored = new OrderEdge(edge.id, edge.source, edge.target, edge.sourceHandle, edge.targetHandle, edge.data ?? {});
            restored.className = edge.className;
            restored.label = edge.label;
            restored.style = edge.style;
            restored.animated = edge.animated;
            restored.markerEnd = edge.markerEnd;
            restored.hidden = edge.hidden;
            edges.push(restored);
            return;
        }

        if (edge.type === "dataEdge") {
            const restored = new DataEdge(edge.id, edge.source, edge.target, edge.sourceHandle, edge.targetHandle, edge.data ?? {});
            restored.className = edge.className;
            restored.label = edge.label;
            restored.style = edge.style;
            restored.animated = edge.animated;
            restored.markerEnd = edge.markerEnd;
            restored.hidden = edge.hidden;
            edges.push(restored);
        }
    });

    const edgeStyleSettings = isValidEdgeStyleSettings(graph.edgeStyleSettings)
        ? graph.edgeStyleSettings
        : undefined;

    return {nodes, edges, edgeStyleSettings};
};
