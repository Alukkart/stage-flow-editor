import type { Edge } from '@xyflow/react';
import {StageFlowNode} from "@/core/nodes/node.types";

export type ValidationError = {
    nodeId?: string;
    edgeId?: string;
    message: string;
};

export function validateGraph(
    nodes: StageFlowNode[],
    edges: Edge[]
): ValidationError[] {
    const errors: ValidationError[] = [];

    // 🔁 cycles (order)
    const orderEdges = edges.filter(e => e.type === 'order');
    const graph = new Map<string, string[]>();

    orderEdges.forEach(e => {
        graph.set(e.source, [...(graph.get(e.source) ?? []), e.target]);
    });

    const visited = new Set<string>();
    const stack = new Set<string>();

    function dfs(nodeId: string) {
        if (stack.has(nodeId)) {
            errors.push({ nodeId, message: 'Cycle detected' });
            return;
        }
        if (visited.has(nodeId)) return;

        visited.add(nodeId);
        stack.add(nodeId);

        for (const next of graph.get(nodeId) ?? []) {
            dfs(next);
        }

        stack.delete(nodeId);
    }

    nodes.forEach(n => dfs(n.id));

    // ❌ terminal must be last
    nodes
        .filter(n => n.type === 'terminalNode')
        .forEach(term => {
            const outgoing = orderEdges.some(e => e.source === term.id);
            if (outgoing) {
                errors.push({
                    nodeId: term.id,
                    message: 'Terminal node cannot have outgoing edges',
                });
            }
        });

    return errors;
}
