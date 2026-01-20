import {BaseEdge} from "@/core/edges/baseEdge";

export class DataEdge extends BaseEdge {
    constructor(id: string, source: string, target: string, data: Record<string, unknown> = {}) {
        super(id, source, target, data, "dataEdge");
    }
}