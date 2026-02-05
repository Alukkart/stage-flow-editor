import {BaseHandle} from "@/core/handles/baseHandle";
import {HandleType, Position} from "@xyflow/react";

export class OrderHandle extends BaseHandle {
    constructor(id: string, type: HandleType, x: number, y: number, pos?: Position) {
        super(id, type, {x: x, y: y}, pos || Position.Bottom, "order");
    }
}
