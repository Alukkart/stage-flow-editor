import type { DataFieldKey, NodeKind } from './node-fields';
import {FlowNodeData} from "@/core/nodes/node.types";

export function hasField<
    K extends NodeKind,
    F extends DataFieldKey
>(
    data: FlowNodeData,
    kind: K,
    field: F
): data is Extract<FlowNodeData, { kind: K }> & {
    [key in F]: string[];
} {
    return (
        data.kind === kind &&
        Array.isArray((data as Record<string, unknown>)[field])
    );
}

export function isNodeKind<K extends NodeKind>(
    data: FlowNodeData,
    kind: K
): data is Extract<FlowNodeData, { kind: K }> {
    return data.kind === kind;
}