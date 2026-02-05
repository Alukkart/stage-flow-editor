import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";
import {OrderHandle} from "@/core/handles/orderHandle";
import {v4 as uuid} from "uuid";

export type ParallelNodeData = {
    policy: 'all' | 'any';
    childrenNodesIds: string[];
};

export type ParallelNodeProps = Node<ParallelNodeData, "parallelNode">;

export class ParallelNode extends BaseNode<ParallelNodeData>{
    constructor(id: string, position: { x: number; y: number }, data?: ParallelNodeData) {
        super(id, position, "parallelNode", data ?? { policy: 'any', childrenNodesIds: [] }, []);

        this.handles = this.buildHandles(data ?? { policy: 'any', childrenNodesIds: [] });
    }

    buildHandles(data: ParallelNodeData) {
        const handles: DataHandle[] = data.childrenNodesIds.map((_, index) => new DataHandle(`var-${index}`, 378.5, 106 + (index * 52)));

        handles.push(new OrderHandle(`${uuid()}-parallel-order-in`, "target", this.measured?.width || 190, -5, Position.Top));

        handles.push(new OrderHandle(`${uuid()}-parallel-order-out`, "source", this.measured?.width || 190, 268 + (data.childrenNodesIds.length * 52)));

        return handles;
    }

    public static setData(node: BaseNode, data: ParallelNodeData) {
        if(node.type !== "parallelNode") {
            throw new Error(`Node type mismatch: expected 'parallelNode', got '${node.type}'`);
        }
        return new ParallelNode(node.id, node.position, data);
    }
}