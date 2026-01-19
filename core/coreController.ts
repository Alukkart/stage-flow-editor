import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import type {EdgeChange, NodeChange} from "@xyflow/react";
import { applyNodeChanges as anc } from "@xyflow/react";
import { applyEdgeChanges as aec } from "@xyflow/react";

export class CoreController {
    private nodes: BaseNode[] = [];
    private edges: BaseEdge[] = [];

    get Nodes() {
        return this.nodes;
    }

    get Edges() {
        return this.edges;
    }

    set Nodes(nodes: BaseNode[]) {
        this.nodes = nodes;
    }

    set Edges(edges: BaseEdge[]) {
        this.edges = edges;
    }

    addNode(node: BaseNode) {
        this.nodes = [...this.nodes, node];
    }

    removeNode(id: string) {
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.edges = this.edges.filter(
            e => e.source !== id && e.target !== id
        );
    }

    addEdge(edge: BaseEdge) {
        this.edges = [...this.edges, edge];
    }

    removeEdge(id: string) {
        this.edges = this.edges.filter(e => e.id !== id);
    }

    applyNodeChanges(changes: NodeChange<BaseNode>[]) {
        this.nodes = anc(changes, this.nodes);
    }

    applyEdgeChanges(changes: EdgeChange<BaseEdge>[]) {
        this.edges = aec(changes, this.edges);
    }

    clear() {
        this.nodes = [];
        this.edges = [];
    }
}
