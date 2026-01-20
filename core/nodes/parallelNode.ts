import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";

export type ParallelNodeData = {
    policy: 'all' | 'any';
    childrenNodesIds: string[];
};

export type ParallelNodeProps = Node<ParallelNodeData, "parallelNode">;

export class ParallelNode extends BaseNode<ParallelNodeData>{
    constructor(id: string, position: { x: number; y: number }, data?: ParallelNodeData) {
        super(id, position, "parallelNode", data ?? { policy: 'any', childrenNodesIds: [] }, [new DataHandle('2', 'target', Position.Right, 0, 0)]);
    }

    public static setData(node: BaseNode, data: ParallelNodeData) {
        if(node.type !== "parallelNode") {
            throw new Error(`Node type mismatch: expected 'parallelNode', got '${node.type}'`);
        }
        return new ParallelNode(node.id, node.position, data);
    }
}