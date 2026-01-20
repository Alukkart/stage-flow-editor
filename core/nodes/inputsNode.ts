import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position, XYPosition} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";

export type InputNodeData = {
    variables: string[];
};

export type InputsNodeProps = Node<InputNodeData, "inputsNode">;

export class InputsNode extends BaseNode<InputNodeData> {
    constructor(id: string, position: XYPosition, data?: InputNodeData) {
        super(id, position, "inputsNode", data ?? { variables: ["var1"] }, [new DataHandle('1', 'source', Position.Right, 0, 0)]);
    }

    public static setData(node: BaseNode, data: InputNodeData) {
        if(node.type !== "inputsNode") {
            throw new Error(`Node type mismatch: expected 'inputsNode', got '${node.type}'`);
        }
        return new InputsNode(node.id, node.position, data);
    }
}
