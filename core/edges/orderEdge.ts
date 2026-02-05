import {BaseEdge} from "@/core/edges/baseEdge";

export class OrderEdge extends BaseEdge{
    constructor(id: string, source: string, target: string, sourceHandle: string, targetHandle: string, data: Record<string, unknown> = {}) {
        super(id, source, target, sourceHandle, targetHandle, data, "orderEdge");
    }
}