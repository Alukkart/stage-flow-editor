import {NodeKind} from "@/core/nodes/node.types";

export type DataFieldKey =
    | 'vars'
    | 'arguments'
    | 'config'
    | 'outputs'
    | 'artifacts';

export const NODE_FIELDS: Record<NodeKind, readonly DataFieldKey[]> = {
    inputs: ['vars'],
    stage: ['arguments', 'config', 'outputs'],
    terminal: ['artifacts'],
    parallel: [],
};
