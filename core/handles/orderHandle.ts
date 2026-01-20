import {BaseHandle} from "@/core/handles/baseHandle";
import {Position} from "@xyflow/react";

export class OrderHandle extends BaseHandle {
    constructor(id: string, x: number, y: number) {
        super(id, "source", {x: x, y: y}, Position.Bottom, "order");
    }
}
