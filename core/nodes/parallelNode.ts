import {BaseNode} from "@/core/nodes/baseNode";
import type {Node} from "@xyflow/react";

type ParallelNodeData = {
    policy: 'all' | 'any';
    childrenNodesIds: string[];
};

export type ParallelNodeProps = Node<ParallelNodeData, "parallelNode">;

export class ParallelNode extends BaseNode{
    data: ParallelNodeData;

    constructor(id: string, position: { x: number; y: number }, data?: ParallelNodeData) {
        super(id, position, "parallelNode");

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