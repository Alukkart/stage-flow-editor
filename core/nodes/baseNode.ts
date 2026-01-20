import type {Node, XYPosition} from "@xyflow/react";
import {NodeHandle} from "@xyflow/system";

export abstract class BaseNode<TData extends Record<string, unknown> = Record<string, unknown>> implements Node<TData> {
    id: string;
    position: XYPosition;
    handles: NodeHandle[];
    type: string;
    data: TData;

    protected constructor(
        id: string,
        position: XYPosition,
        type: string,
        data: TData,
        handles: NodeHandle[]
    ) {
        this.id = id;
        this.position = position;
        this.type = type;
        this.data = data;
        this.handles = handles;
    }
}

