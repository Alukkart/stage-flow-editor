import {BaseHandle} from "@/core/handles/baseHandle";
import {Position} from "@xyflow/react";

export class DataTargetHandle extends BaseHandle {
    constructor(id: string, x: number, y: number) {
        super(id, "target", {x: x, y: y}, Position.Left, "data");
    }
}
