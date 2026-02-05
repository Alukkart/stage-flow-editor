import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {StageNode} from "@/core/nodes/stageNode";

export const autoLayoutNodes = (nodes: BaseNode[], edges: BaseEdge[]) => {
    const orderEdges = edges.filter((edge) => edge.type === "orderEdge");
    const nodeIds = nodes.map((node) => node.id);
    const incomingCount = new Map<string, number>();
    const outgoing = new Map<string, string[]>();

    nodeIds.forEach((id) => {
        incomingCount.set(id, 0);
        outgoing.set(id, []);
    });

    orderEdges.forEach((edge) => {
        if (!incomingCount.has(edge.target)) return;
        incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
        outgoing.get(edge.source)?.push(edge.target);
    });

    const queue = nodeIds.filter((id) => (incomingCount.get(id) ?? 0) === 0);
    const levels = new Map<string, number>();
    let index = 0;

    while (index < queue.length) {
        const current = queue[index++];
        const currentLevel = levels.get(current) ?? 0;
        levels.set(current, currentLevel);

        (outgoing.get(current) ?? []).forEach((next) => {
            const nextCount = (incomingCount.get(next) ?? 0) - 1;
            incomingCount.set(next, nextCount);
            if (nextCount === 0) {
                levels.set(next, currentLevel + 1);
                queue.push(next);
            }
        });
    }

    const maxLevel = Math.max(0, ...Array.from(levels.values()));
    nodeIds.forEach((id) => {
        if (!levels.has(id)) {
            levels.set(id, maxLevel + 1);
        }
    });

    const layers = new Map<number, string[]>();
    nodeIds.forEach((id) => {
        const level = levels.get(id) ?? 0;
        const list = layers.get(level) ?? [];
        list.push(id);
        layers.set(level, list);
    });

    const xGap = 420;
    const yGap = 320;

    const positioned = new Map<string, {x: number; y: number}>();
    Array.from(layers.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([level, ids]) => {
            ids.forEach((id, i) => {
                positioned.set(id, {x: i * xGap, y: level * yGap});
            });
        });

    return nodes.map((node) => {
        const nextPos = positioned.get(node.id) ?? node.position;

        if (node.type === "inputsNode") {
            return new InputsNode(node.id, nextPos, node.data as InputsNode["data"]);
        }

        if (node.type === "parallelNode") {
            return new ParallelNode(node.id, nextPos, node.data as ParallelNode["data"]);
        }

        if (node.type === "stageNode") {
            return new StageNode(node.id, nextPos, node.data as StageNode["data"]);
        }

        node.position = nextPos;
        return node;
    });
};
