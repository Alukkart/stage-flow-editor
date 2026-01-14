import { addEdge, type Edge, type Connection } from '@xyflow/react';
import { parseHandleId } from './handle-parser';
import {hasField, isNodeKind} from '../nodes/node-utils';
import {FlowNode} from "@/core/nodes/node.types";

export function applyConnection(
    nodes: FlowNode[],
    edges: Edge[],
    connection: Connection
): { nodes: FlowNode[]; edges: Edge[] } | null {
    const { source, target } = connection;
    if (!source || !target) return null;

    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    if (!sourceNode || !targetNode) return null;

    const sourceParsed = parseHandleId(connection.sourceHandle);
    const targetParsed = parseHandleId(connection.targetHandle);

    // ORDER edge
    if (!sourceParsed || !targetParsed) {
        return {
            nodes,
            edges: addEdge({ ...connection, type: 'order' }, edges),
        };
    }

    const sourceData = sourceNode.data;
    const targetData = targetNode.data;

    if (
        !isNodeKind(sourceData, sourceData.kind) ||
        !isNodeKind(targetData, targetData.kind)
    ) {
        return null;
    }

    const sourceKind = sourceData.kind;
    const targetKind = targetData.kind;


    if (
        !hasField(sourceNode.data, sourceKind, sourceParsed.field) ||
        !hasField(targetNode.data, targetKind, targetParsed.field)
    ) {
        return null;
    }

    const newSource = [...sourceNode.data[sourceParsed.field]];
    const newTarget = [...targetNode.data[targetParsed.field]];

    newSource[sourceParsed.index] =
        newTarget[targetParsed.index] ?? '';

    newTarget[targetParsed.index] = '';

    return {
        nodes: nodes.map(n => {
            if (n.id === sourceNode.id) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        [sourceParsed.field]: newSource,
                    },
                };
            }
            if (n.id === targetNode.id) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        [targetParsed.field]: newTarget,
                    },
                };
            }
            return n;
        }),
        edges: addEdge({ ...connection, type: 'data' }, edges),
    };
}