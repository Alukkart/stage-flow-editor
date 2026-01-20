import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {InputsNodeComp} from "@/components/nodes/inputs-node";
import {ParallelNodeComp} from "@/components/nodes/parallel-node";
import {NodeTypes} from "@xyflow/react";

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
} satisfies NodeTypes;