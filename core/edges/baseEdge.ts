import {Edge} from "@xyflow/react";

export abstract class BaseEdge implements Edge {
    data: Record<string, unknown>;
    id: string;
    source: string;
    target: string;
    type: string

    constructor(id: string, source: string, target: string, data: Record<string, unknown> = {}, type: string) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.data = data;
        this.type = type;
    }
}