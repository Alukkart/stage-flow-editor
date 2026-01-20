import {NodeHandle} from "@xyflow/system";
import {HandleType, Position} from "@xyflow/react";

export abstract class BaseHandle implements NodeHandle {
    position: Position;
    type: HandleType;
    x: number;
    y: number;

    purpose: string

    protected constructor(purpose: string, type: HandleType, position: Position, x: number, y: number) {
        this.position = position;
        this.type = type;
        this.x = x;
        this.y = y;

        this.purpose = purpose;
    }
}