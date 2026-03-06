import dagre from "dagre";
import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {StageNode} from "@/core/nodes/stageNode";
import {ConditionNode} from "@/core/nodes/conditionNode";
import {TerminalNode} from "@/core/nodes/terminalNode";

export type LayoutConfig = {
    nodesep: number;
    ranksep: number;
    branchOffset: number;
};

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    nodesep: 400,
    ranksep: 400,
    branchOffset: 700,
};

const estimateNodeSize = (node: BaseNode) => {
    if (node.type === "stageNode") {
        const stageNode = node as StageNode;
        const argsCount = stageNode.data.stage.arguments.length;
        const outputsCount = stageNode.data.stage.outputs.length;
        const configCount = stageNode.data.stage.config.length;
        const h = 70 + (argsCount + outputsCount + configCount) * 26 + 12;
        return {w: 380, h};
    }

    if (node.type === "conditionNode") {
        const conditionNode = node as ConditionNode;
        const h = 140 + Math.max(conditionNode.data.conditions.length, 1) * 92;
        return {w: 380, h};
    }

    if (node.type === "parallelNode") {
        const parallelNode = node as ParallelNode;
        const h = 160 + Math.max(parallelNode.data.childrenNodesIds.length, 1) * 56;
        return {w: 380, h};
    }

    if (node.type === "terminalNode") {
        const terminalNode = node as TerminalNode;
        const h = 140 + Math.max(terminalNode.data.artifacts.length, 1) * 52;
        return {w: 380, h};
    }

    if (node.type === "inputsNode") {
        const inputsNode = node as InputsNode;
        const h = 120 + Math.max(inputsNode.data.variables.length, 1) * 52;
        return {w: 380, h};
    }

    return {w: 380, h: 220};
};

const rematerializeNode = (node: BaseNode, position: {x: number; y: number}) => {
    if (node.type === "inputsNode") {
        return new InputsNode(node.id, position, node.data as InputsNode["data"]);
    }

    if (node.type === "parallelNode") {
        return new ParallelNode(node.id, position, node.data as ParallelNode["data"]);
    }

    if (node.type === "stageNode") {
        return new StageNode(node.id, position, node.data as StageNode["data"]);
    }

    if (node.type === "conditionNode") {
        return new ConditionNode(node.id, position, node.data as ConditionNode["data"]);
    }

    if (node.type === "terminalNode") {
        return new TerminalNode(node.id, position, node.data as TerminalNode["data"]);
    }

    node.position = position;
    return node;
};

export const autoLayoutNodes = (
    nodes: BaseNode[],
    edges: BaseEdge[],
    cfg: Partial<LayoutConfig> = {},
) => {
    const config: LayoutConfig = {...DEFAULT_LAYOUT_CONFIG, ...cfg};
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        rankdir: "TB",
        nodesep: config.nodesep,
        ranksep: config.ranksep,
    });

    nodes.forEach((node) => {
        const size = estimateNodeSize(node);
        graph.setNode(node.id, {width: size.w, height: size.h});
    });

    const flowEdges = edges.filter((edge) => edge.type === "orderEdge");
    flowEdges.forEach((edge) => {
        if (!graph.node(edge.source) || !graph.node(edge.target)) return;
        graph.setEdge(edge.source, edge.target);
    });

    dagre.layout(graph);

    const positionedById = new Map<string, BaseNode>();
    const fallbackBaseX = 150;
    const fallbackBaseY = 80;
    const fallbackXGap = 360;
    const fallbackYGap = 220;

    nodes.forEach((node, index) => {
        const layoutNode = graph.node(node.id);
        const size = estimateNodeSize(node);
        const x = typeof layoutNode?.x === "number"
            ? layoutNode.x - size.w / 2
            : fallbackBaseX + (index % 5) * fallbackXGap;
        const y = typeof layoutNode?.y === "number"
            ? layoutNode.y - size.h / 2
            : fallbackBaseY + index * fallbackYGap;

        positionedById.set(node.id, rematerializeNode(node, {x, y}));
    });

    const outgoingBySource = new Map<string, BaseEdge[]>();
    flowEdges.forEach((edge) => {
        if (!outgoingBySource.has(edge.source)) {
            outgoingBySource.set(edge.source, []);
        }
        outgoingBySource.get(edge.source)!.push(edge);
    });

    nodes.forEach((node) => {
        if (node.type !== "conditionNode") return;

        const sourceNode = positionedById.get(node.id);
        if (!sourceNode) return;

        const out = outgoingBySource.get(node.id) ?? [];
        const leftTargets: string[] = [];
        const rightTargets: string[] = [];

        out.forEach((edge) => {
            const label = String(edge.label ?? "").toLowerCase();
            if (label.includes("true")) {
                leftTargets.push(edge.target);
                return;
            }
            if (label.includes("false") || label.includes("else")) {
                rightTargets.push(edge.target);
            }
        });

        const unassigned = out
            .map((edge) => edge.target)
            .filter((target) => !leftTargets.includes(target) && !rightTargets.includes(target));
        unassigned.forEach((target, index) => {
            if (index % 2 === 0) {
                leftTargets.push(target);
                return;
            }
            rightTargets.push(target);
        });

        leftTargets.forEach((targetId) => {
            const targetNode = positionedById.get(targetId);
            if (!targetNode) return;
            targetNode.position = {
                x: sourceNode.position.x - config.branchOffset,
                y: targetNode.position.y,
            };
        });

        rightTargets.forEach((targetId) => {
            const targetNode = positionedById.get(targetId);
            if (!targetNode) return;
            targetNode.position = {
                x: sourceNode.position.x + config.branchOffset,
                y: targetNode.position.y,
            };
        });
    });

    return nodes.map((node) => positionedById.get(node.id) ?? node);
};

