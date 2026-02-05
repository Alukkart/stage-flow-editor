import type {Node, XYPosition} from "@xyflow/react";
import {BaseHandle} from "@/core/handles/baseHandle";

export abstract class BaseNode<TData extends Record<string, unknown> = Record<string, unknown>> implements Node<TData> {
    id: string;
    position: XYPosition;
    handles: BaseHandle[];
    measured: { width: number; height: number;} | undefined;
    type: string;
    data: TData;

    protected constructor(
        id: string,
        position: XYPosition,
        type: string,
        data: TData,
        handles: BaseHandle[]
    ) {
        this.id = id;
        this.position = position;
        this.type = type;
        this.data = data;
        this.handles = handles;
    }
}

