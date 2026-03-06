import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position, XYPosition} from "@xyflow/react";
import {OrderHandle} from "@/core/handles/orderHandle";

export type ConditionItem = {
    if: Record<string, unknown>;
    then: string;
};

export type ConditionNodeData = {
    conditions: ConditionItem[];
    elseNodeId?: string | null;
};

export type ConditionNodeProps = Node<ConditionNodeData, "conditionNode">;

export class ConditionNode extends BaseNode<ConditionNodeData> {
    constructor(id: string, position: XYPosition, data?: ConditionNodeData) {
        super(
            id,
            position,
            "conditionNode",
            data ?? {conditions: [{if: {"==": [{var: ""}, ""]}, then: ""}], elseNodeId: null},
            [],
        );

        this.connectors = this.buildHandles(this.data);
    }

    buildHandles(data: ConditionNodeData) {
        const handles = data.conditions.map((_, index) =>
            new OrderHandle(`flow-then-${index}`, "source", 378.5, 132 + (index * 92), Position.Right),
        );

        handles.push(new OrderHandle("flow-input", "target", this.measured?.width || 190, -5, Position.Top));
        handles.push(
            new OrderHandle(
                "flow-else",
                "source",
                378.5,
                132 + (Math.max(data.conditions.length, 1) * 92),
                Position.Right,
            ),
        );

        return handles;
    }

    public static setData(node: BaseNode, data: ConditionNodeData) {
        if (node.type !== "conditionNode") {
            throw new Error(`Node type mismatch: expected 'conditionNode', got '${node.type}'`);
        }
        return new ConditionNode(node.id, node.position, data);
    }
}
