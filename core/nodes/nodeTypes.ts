import {InputNode} from "@/core/nodes/inputNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {InputsNodeComp} from "@/components/nodes/inputs-node";
import {ParallelNodeComp} from "@/components/nodes/parallel-node";
import {NodeTypes} from "@xyflow/react";

export type NodeClassType =
    typeof InputNode |
    typeof ParallelNode

export const NodeClasses = {
    inputNode: InputNode,
    parallelNode: ParallelNode,
}

export const nodeTypes = {
    inputsNode: InputsNodeComp,
    parallelNode: ParallelNodeComp,
} satisfies NodeTypes;