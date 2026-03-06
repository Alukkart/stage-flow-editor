import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {InputsNodeComp} from "@/components/nodes/inputs-node";
import {ParallelNodeComp} from "@/components/nodes/parallel-node";
import {StageNodeComp} from "@/components/nodes/stage-node";
import {ConditionNodeComp} from "@/components/nodes/condition-node";
import {TerminalNodeComp} from "@/components/nodes/terminal-node";
import {EdgeTypes, NodeTypes} from "@xyflow/react";
import OrderEdgeComp from "@/components/edges/order-edge";
import {ConditionNode} from "@/core/nodes/conditionNode";
import {TerminalNode} from "@/core/nodes/terminalNode";

export type NodeClassType =
    typeof InputsNode |
    typeof ParallelNode |
    typeof ConditionNode |
    typeof TerminalNode

export const NodeClasses = {
    inputsNode: InputsNode,
    parallelNode: ParallelNode,
    conditionNode: ConditionNode,
    terminalNode: TerminalNode,
}

export const nodeTypes = {
    inputsNode: InputsNodeComp,
    parallelNode: ParallelNodeComp,
    conditionNode: ConditionNodeComp,
    terminalNode: TerminalNodeComp,
    stageNode: StageNodeComp,
} satisfies NodeTypes;

export const edgeTypes = {
    orderEdge: OrderEdgeComp,
    dataEdge: OrderEdgeComp,
} satisfies EdgeTypes;
