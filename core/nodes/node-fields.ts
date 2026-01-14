import {InputsNodeData, ParallelNodeData, StageNodeData, TerminalNodeData} from "@/core/nodes/node.types";


export type NodeDataByKind = {
    inputs: InputsNodeData;
    stage: StageNodeData;
    terminal: TerminalNodeData;
    parallel: ParallelNodeData;
};

export type NodeKind = keyof NodeDataByKind;

export type DataFieldKey =
    | 'vars'
    | 'arguments'
    | 'config'
    | 'outputs'
    | 'artifacts';
