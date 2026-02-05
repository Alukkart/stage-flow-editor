import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import type {Connection, EdgeChange, NodeChange} from "@xyflow/react";
import { applyNodeChanges as anc } from "@xyflow/react";
import { applyEdgeChanges as aec } from "@xyflow/react";
import {DataEdge} from "@/core/edges/dataEdge";
import {OrderEdge} from "@/core/edges/orderEdge";


export class CoreController {
    private nodes: BaseNode[] = [];
    private edges: BaseEdge[] = [];

    connect(conn: Connection){
        console.debug("Connecting:", conn);
        const sourceNode = this.nodes.find(n => n.id === conn.source);
        const targetNode = this.nodes.find(n => n.id === conn.target);

        console.log("Source Node:", sourceNode);
        console.log("Target Node:", targetNode);

        const sourceHandle = sourceNode?.handles.find(h => h.id === conn.sourceHandle) || null;
        const targetHandle = targetNode?.handles.find(h => h.id === conn.targetHandle) || null;

        if(sourceNode && targetNode && sourceHandle && targetHandle){
            if(sourceHandle.kind !== targetHandle.kind) throw Error("Different handle kinds cannot be connected");

            const edgeId = `${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`;
            if (this.edges.some((edge) => edge.id === edgeId)) {
                return;
            }
            switch(sourceHandle.kind){
                case "data":
                    const newDataEdge = new DataEdge(edgeId, conn.source!, conn.target!, conn.sourceHandle!, conn.targetHandle!);
                    this.addEdge(newDataEdge);
                    break;
                case "order":
                    const newOrderEdge = new OrderEdge(edgeId, conn.source!, conn.target!, conn.sourceHandle!, conn.targetHandle!);
                    this.addEdge(newOrderEdge);
                    break;
            }
        }else{
            throw Error(`Connection error: not found ${!sourceNode ? 'source node' : ''} ${!targetNode ? 'target node' : ''} ${!sourceHandle ? 'source handle' : ''} ${!targetHandle ? 'target handle' : ''}`);
        }
    }

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
