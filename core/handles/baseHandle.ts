import {HandleType, Position, XYPosition} from "@xyflow/react";
import {NodeHandle} from "@xyflow/system";

export type HandleKind =
    | "data"
    | "order"

export abstract class BaseHandle implements NodeHandle{
    id: string;
    type: HandleType;
    position: Position;
    width: number = 10;
    height: number = 10
    x: number;
    y: number

    /** логический тип */
    kind: HandleKind;

    protected constructor(
        id: string,
        type: HandleType,
        XYposition: XYPosition,
        position: Position,
        kind: HandleKind
    ) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.kind = kind;
        this.x = XYposition.x;
        this.y = XYposition.y;
    }
}