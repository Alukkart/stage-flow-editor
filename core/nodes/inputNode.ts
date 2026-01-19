import {BaseNode} from "@/core/nodes/baseNode";
import type {Node, XYPosition} from "@xyflow/react";

export type InputNodeData = {
    variables: string[];
};

export type InputsNodeProps = Node<InputNodeData, "inputsNode">;

export class InputNode extends BaseNode<InputNodeData> {
    constructor(id: string, position: XYPosition, data?: InputNodeData) {
        super(id, position, "inputsNode", data ?? { variables: ["var1"] });
    }

    addVariable() {
        const nextIndex = this.data.variables.length + 1;

        this.data = {
            ...this.data,
            variables: [...this.data.variables, `var${nextIndex}`],
        };
    }

    removeVariable(variable: string) {
        this.data = {
            ...this.data,
            variables: this.data.variables.filter(v => v !== variable),
        };
    }

    updateVariable(index: number, value: string) {
        const variables = [...this.data.variables];
        variables[index] = value;

        this.data = {
            ...this.data,
            variables,
        };
    }
}
