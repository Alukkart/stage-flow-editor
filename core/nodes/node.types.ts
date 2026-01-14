import type {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from '@xyflow/react';
import {FlowSnapshot} from "@/core/nodes/history.types";
import {InputsNode} from "@/components/nodes/inputs-node";
import {TerminalNode} from "@/components/nodes/terminal-node";
import {ParallelNode} from "@/components/nodes/parallel-node";
import {StageNode} from "@/components/nodes/stage-node";

export type NodeKind =
    | 'inputs'
    | 'stage'
    | 'terminal'
    | 'parallel';

export type InputsNodeData = {
    kind: 'inputs';
    vars: string[];
};

export type StageNodeData = {
    kind: 'stage';
    arguments: string[];
    config: string[];
    outputs: string[];
};

export type TerminalNodeData = {
    kind: 'terminal';
    result: string;
    artifacts: string[];
};

export type ParallelNodeData = {
    kind: 'parallel';
    policy: string;
    childrenNodes: string[];
};

export type FlowNodeData =
    | InputsNodeData
    | StageNodeData
    | TerminalNodeData
    | ParallelNodeData;

export type FlowNode = Node<FlowNodeData>;

export type NodesState = {
    nodes: FlowNode[];
    edges: Edge[];
    history: {
        past: FlowSnapshot[];
        future: FlowSnapshot[];
    };

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    setNodes(nodes: FlowNode[]): void;
    setEdges(edges: Edge[]): void;

    deleteNode(id: string): void;
    deleteEdge(id: string): void;

    addNode: (node: Partial<FlowNode> & { type: string }) => void;

    updateNodeData(
        id: string,
        updater: (data: Record<string, unknown>) => Record<string, unknown>
    ): void;

    pushHistory(): void
    undo(): void;
    redo(): void;

    autoLayoutNodes(): void
};

export const nodeTypes = {
    inputsNode: InputsNode,
    terminalNode: TerminalNode,
    parallelNode: ParallelNode,
    stageNode: StageNode
};