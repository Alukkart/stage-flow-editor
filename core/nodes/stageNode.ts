import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position, XYPosition} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";
import {DataTargetHandle} from "@/core/handles/dataTargetHandle";
import {OrderHandle} from "@/core/handles/orderHandle";

export type StageParam = {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
    value?: string;
};

export type StageDefinition = {
    stage_name: string;
    skipable: boolean;
    allowed_events: string[];
    allowed_inputs: string[];
    category: string;
    description?: string;
    arguments: StageParam[];
    config: StageParam[];
    outputs: StageParam[];
};

export type StageNodeData = {
    stage: StageDefinition;
    nextNodeId?: string | null;
};

export type StageNodeProps = Node<StageNodeData, "stageNode">;

export const stageHandleId = (kind: "arg" | "cfg" | "out", name: string) =>
    `${kind}-${name}`;

const LAYOUT = {
    startY: 136,
    rowHeight: 52,
    sectionGap: 36,
    leftX: 0,
    rightX: 378.5,
};

export class StageNode extends BaseNode<StageNodeData> {
    constructor(id: string, position: XYPosition, data: StageNodeData) {
        super(id, position, "stageNode", data, []);

        this.connectors = this.buildHandles(data);
    }

    buildHandles(data: StageNodeData) {
        const handles = [];
        let y = LAYOUT.startY;

        handles.push(new OrderHandle("flow-input", "target", this.measured?.width || 190, -5, Position.Top));

        data.stage.arguments.forEach((arg) => {
            handles.push(new DataTargetHandle(stageHandleId("arg", arg.name), LAYOUT.leftX, y));
            y += LAYOUT.rowHeight;
        });

        y += LAYOUT.sectionGap;

        data.stage.outputs.forEach((output) => {
            handles.push(new DataHandle(stageHandleId("out", output.name), LAYOUT.rightX, y));
            y += LAYOUT.rowHeight;
        });

        y += LAYOUT.sectionGap;

        y += data.stage.config.length * LAYOUT.rowHeight;

        handles.push(new OrderHandle("flow-output", "source", this.measured?.width || 190, y + 40));

        return handles;
    }

    public static setData(node: BaseNode, data: StageNodeData) {
        if (node.type !== "stageNode") {
            throw new Error(`Node type mismatch: expected 'stageNode', got '${node.type}'`);
        }

        return new StageNode(node.id, node.position, data);
    }
}
