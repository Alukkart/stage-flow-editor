import {Edge} from "@xyflow/react";

export abstract class BaseEdge implements Edge {
    id: string;
    source: string;
    target: string;

    sourceHandle: string;
    targetHandle: string;

    type: string

    data: Record<string, unknown>;

    protected constructor(id: string, source: string, target: string, sourceHandle: string, targetHandle: string, data: Record<string, unknown> = {}, type: string) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.sourceHandle = sourceHandle;
        this.targetHandle = targetHandle;
        this.data = data;
        this.type = type;
    }
}