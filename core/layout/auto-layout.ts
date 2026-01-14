import dagre from 'dagre';
import type { Edge } from '@xyflow/react';
import {StageFlowNode} from "@/core/nodes/node.types";

export function autoLayout(
    nodes: StageFlowNode[],
    edges: Edge[],
    direction: 'TB' | 'LR' = 'TB'
): StageFlowNode[] {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: direction });

    nodes.forEach(n =>
        g.setNode(n.id, { width: 180, height: 80 })
    );

    edges.forEach(e => g.setEdge(e.source, e.target));

    dagre.layout(g);

    return nodes.map(n => {
        const { x, y } = g.node(n.id);
        return {
            ...n,
            position: {
                x: x - 90,
                y: y - 40,
            },
        };
    });
}
