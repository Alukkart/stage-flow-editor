import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position, XYPosition} from "@xyflow/react";
import {DataTargetHandle} from "@/core/handles/dataTargetHandle";
import {OrderHandle} from "@/core/handles/orderHandle";

export type TerminalNodeData = {
    result: string;
    artifacts: string[];
};

export type TerminalNodeProps = Node<TerminalNodeData, "terminalNode">;

export class TerminalNode extends BaseNode<TerminalNodeData> {
    constructor(id: string, position: XYPosition, data?: TerminalNodeData) {
        super(id, position, "terminalNode", data ?? {result: "success", artifacts: []}, []);
        this.connectors = this.buildHandles(this.data);
    }

    buildHandles(data: TerminalNodeData) {
        const handles = data.artifacts.map((_, index) => new DataTargetHandle(`artifact-${index}`, 0, 132 + (index * 52)));
        handles.push(new OrderHandle("flow-input", "target", this.measured?.width || 190, -5, Position.Top));
        return handles;
    }

    public static setData(node: BaseNode, data: TerminalNodeData) {
        if (node.type !== "terminalNode") {
            throw new Error(`Node type mismatch: expected 'terminalNode', got '${node.type}'`);
        }
        return new TerminalNode(node.id, node.position, data);
    }
}
