import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position} from "@xyflow/react";
import {OrderHandle} from "@/core/handles/orderHandle";

export type ParallelNodeData = {
    policy: 'all' | 'any';
    childrenNodesIds: string[];
    nextNodeId?: string | null;
};

export type ParallelNodeProps = Node<ParallelNodeData, "parallelNode">;

export class ParallelNode extends BaseNode<ParallelNodeData>{
    constructor(id: string, position: { x: number; y: number }, data?: ParallelNodeData) {
        super(id, position, "parallelNode", data ?? {policy: 'all', childrenNodesIds: [], nextNodeId: null}, []);

        this.connectors = this.buildHandles(data ?? {policy: 'all', childrenNodesIds: [], nextNodeId: null});
    }

    buildHandles(data: ParallelNodeData) {
        const handles = data.childrenNodesIds.map((_, index) =>
            new OrderHandle(`flow-child-${index}`, "source", 378.5, 106 + (index * 52), Position.Right)
        );

        handles.push(new OrderHandle("flow-input", "target", this.measured?.width || 190, -5, Position.Top));
        handles.push(new OrderHandle("flow-next", "source", this.measured?.width || 190, 268 + (data.childrenNodesIds.length * 52)));

        return handles;
    }

    public static setData(node: BaseNode, data: ParallelNodeData) {
        if(node.type !== "parallelNode") {
            throw new Error(`Node type mismatch: expected 'parallelNode', got '${node.type}'`);
        }
        return new ParallelNode(node.id, node.position, data);
    }
}
