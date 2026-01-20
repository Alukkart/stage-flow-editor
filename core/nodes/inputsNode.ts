import {BaseNode} from "@/core/nodes/baseNode";
import {Node, XYPosition} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";
import {OrderHandle} from "@/core/handles/orderHandle";

export type InputNodeData = {
    variables: string[];
};

export type InputsNodeProps = Node<InputNodeData, "inputsNode">;

export class InputsNode extends BaseNode<InputNodeData> {
    constructor(id: string, position: XYPosition, data?: InputNodeData) {
        super(id, position, "inputsNode", data ?? { variables: ["var1"] }, InputsNode.buildHandles(data ?? { variables: ["var1"] }));
    }

    static buildHandles(data: InputNodeData) {
        const handles: DataHandle[] = data.variables.map((_, index) => new DataHandle(`var-${index}`, 378.5, 106 + (index * 52)));

        handles.push(new OrderHandle(`order-out`, 378.5, 22));

        return handles;
    }

    public static setData(node: BaseNode, data: InputNodeData) {
        if (node.type !== "inputsNode") {
            throw new Error(`Node type mismatch: expected 'inputsNode', got '${node.type}'`);
        }

        return new InputsNode(node.id, node.position, data);
    }
}
