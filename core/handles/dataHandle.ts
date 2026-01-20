import {BaseHandle} from "@/core/handles/baseHandle";
import {HandleType, Position} from "@xyflow/react";

export class DataHandle extends BaseHandle{
    constructor(id: string, type: HandleType, position: Position, x: number, y: number) {
        super(id, type, position, x, y);
    }
}