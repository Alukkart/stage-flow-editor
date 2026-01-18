import {BaseNode} from "@/core/nodes/baseNode";
import type {Node} from "@xyflow/react";

type InputNodeData = {
    variables: string[];
};

export type InputsNodeProps = Node<InputNodeData, "inputsNode">;

export class InputNode extends BaseNode{
    data: InputNodeData

    constructor(id: string, position: { x: number; y: number }, variables?: InputNodeData) {
        super(id, position, "inputsNode");

        this.data = variables ?? { variables: ["var1"] };
    }


}