import {BaseNode} from "@/core/nodes/baseNode";
import {Node, XYPosition} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";
import {OrderHandle} from "@/core/handles/orderHandle";
import {v4 as uuid} from "uuid";

export type InputNodeData = {
    variables: string[];
};

export type InputsNodeProps = Node<InputNodeData, "inputsNode">;

export class InputsNode extends BaseNode<InputNodeData> {
    constructor(id: string, position: XYPosition, data?: InputNodeData) {
        super(id, position, "inputsNode", data ?? { variables: ["var1"] }, []);

        this.handles = this.buildHandles(data ?? { variables: ["var1"] })
    }

    buildHandles(data: InputNodeData) {
        const handles: DataHandle[] = data.variables.map((_, index) => new DataHandle(`var-${index}`, 378.5, 106 + (index * 52)));

        handles.push(new OrderHandle(`${uuid()}-inputs-order-out`, "source", this.measured?.width || 190, 147 + (data.variables.length * 52)));

        return handles;
    }

    public static setData(node: BaseNode, data: InputNodeData) {
        if (node.type !== "inputsNode") {
            throw new Error(`Node type mismatch: expected 'inputsNode', got '${node.type}'`);
        }

        return new InputsNode(node.id, node.position, data);
    }
}
