import {BaseNode} from "@/core/nodes/baseNode";
import type {Node} from "@xyflow/react";

export type ParallelNodeData = {
    policy: 'all' | 'any';
    childrenNodesIds: string[];
};

export type ParallelNodeProps = Node<ParallelNodeData, "parallelNode">;

export class ParallelNode extends BaseNode<ParallelNodeData>{
    constructor(id: string, position: { x: number; y: number }, data: ParallelNodeData) {
        super(id, position, "parallelNode", data);

        if(data){
            this.data = data;
        } else {
            this.data = {
                policy: 'all',
                childrenNodesIds: [],
            };
        }
    }
}