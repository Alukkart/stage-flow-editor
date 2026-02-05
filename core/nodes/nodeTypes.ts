import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {InputsNodeComp} from "@/components/nodes/inputs-node";
import {ParallelNodeComp} from "@/components/nodes/parallel-node";
import {StageNodeComp} from "@/components/nodes/stage-node";
import {EdgeTypes, NodeTypes} from "@xyflow/react";
import OrderEdgeComp from "@/components/edges/order-edge";

export type NodeClassType =
    typeof InputsNode |
    typeof ParallelNode

export const NodeClasses = {
    inputsNode: InputsNode,
    parallelNode: ParallelNode,
}

export const nodeTypes = {
    inputsNode: InputsNodeComp,
    parallelNode: ParallelNodeComp,
    stageNode: StageNodeComp,
} satisfies NodeTypes;

export const edgeTypes = {
    orderEdge: OrderEdgeComp,
    dataEdge: OrderEdgeComp,
} satisfies EdgeTypes;
