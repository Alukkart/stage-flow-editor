import {BaseNode} from "@/core/nodes/baseNode";
import {Node, XYPosition} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";
import {OrderHandle} from "@/core/handles/orderHandle";

export type InputNodeData = {
    variables: string[];
    nextNodeId?: string | null;
};

export type InputsNodeProps = Node<InputNodeData, "inputsNode">;

export class InputsNode extends BaseNode<InputNodeData> {
    constructor(id: string, position: XYPosition, data?: InputNodeData) {
        super(id, position, "inputsNode", data ?? {variables: ["input_1"], nextNodeId: null}, []);

        this.connectors = this.buildHandles(data ?? {variables: ["input_1"], nextNodeId: null})
    }

    buildHandles(data: InputNodeData) {
        const handles: DataHandle[] = data.variables.map((name, index) => new DataHandle(`out-${name}`, 378.5, 106 + (index * 52)));
        handles.push(new OrderHandle("flow-output", "source", this.measured?.width || 190, 147 + (data.variables.length * 52)));

        return handles;
    }

    public static setData(node: BaseNode, data: InputNodeData) {
        if (node.type !== "inputsNode") {
            throw new Error(`Node type mismatch: expected 'inputsNode', got '${node.type}'`);
        }

        return new InputsNode(node.id, node.position, data);
    }
}
