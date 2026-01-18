import type {Node, XYPosition} from "@xyflow/react";
import {NodeHandle} from "@xyflow/system";

export abstract class BaseNode implements Node {
    // xyflow node properties
    id: string;
    position: XYPosition;
    handles: NodeHandle[] = []

    abstract data: Record<string, unknown>

    // custom properties
    type: string

    protected constructor(id: string, position: XYPosition, type: string) {
        this.id = id;
        this.position = position;
        this.type = type;
    }

    setData(data: never): void {
        this.data = data;
    }
}
