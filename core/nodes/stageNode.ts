import {BaseNode} from "@/core/nodes/baseNode";
import {Node, Position, XYPosition} from "@xyflow/react";
import {DataHandle} from "@/core/handles/dataHandle";
import {DataTargetHandle} from "@/core/handles/dataTargetHandle";
import {OrderHandle} from "@/core/handles/orderHandle";
import {v4 as uuid} from "uuid";

export type StageParam = {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
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
};

export type StageNodeProps = Node<StageNodeData, "stageNode">;

const normalizeHandleKey = (value: string) =>
    value.replace(/[^a-zA-Z0-9_-]/g, "_");

export const stageHandleId = (kind: "arg" | "cfg" | "out", name: string) =>
    `${kind}-${normalizeHandleKey(name)}`;

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

        this.handles = this.buildHandles(data);
    }

    buildHandles(data: StageNodeData) {
        const handles = [];
        let y = LAYOUT.startY;

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

        data.stage.config.forEach((cfg) => {
            handles.push(new DataTargetHandle(stageHandleId("cfg", cfg.name), LAYOUT.leftX, y));
            y += LAYOUT.rowHeight;
        });

        handles.push(
            new OrderHandle(`${uuid()}-stage-order-in`, "target", this.measured?.width || 190, -5, Position.Top)
        );
        handles.push(
            new OrderHandle(`${uuid()}-stage-order-out`, "source", this.measured?.width || 190, y + 40)
        );

        return handles;
    }

    public static setData(node: BaseNode, data: StageNodeData) {
        if (node.type !== "stageNode") {
            throw new Error(`Node type mismatch: expected 'stageNode', got '${node.type}'`);
        }

        return new StageNode(node.id, node.position, data);
    }
}
