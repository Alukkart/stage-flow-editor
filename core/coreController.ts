import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import type {EdgeChange, NodeChange} from "@xyflow/react";
import { applyNodeChanges as anc } from "@xyflow/react";
import { applyEdgeChanges as aec } from "@xyflow/react";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";

const DEFAULT_NODES: BaseNode[] = [
    new InputsNode('1', { x: 0, y: 0 }, { variables: ['input1', 'input2'] }),
    new ParallelNode('2', { x: 500, y: 500 }, { policy: 'all', childrenNodesIds: [] })
];
const DEFAULT_EDGES: BaseEdge[] = [
    // new DataEdge('1-2', '1', '2')
];

export class CoreController {
    private nodes: BaseNode[] = DEFAULT_NODES;
    private edges: BaseEdge[] = DEFAULT_EDGES;

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

    updateNode(id: string, updater: (node: BaseNode) => BaseNode) {
        this.nodes = this.nodes.map(n => {
            if (n.id === id) {
                return updater(n);
            }
            return n;
        });
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
