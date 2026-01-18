import {create} from 'zustand';
import {BaseEdge} from "@/core/edges/baseEdge";
import {BaseNode} from "@/core/nodes/baseNode";
import {CoreController} from "@/core/coreController";
import {EdgeChange, NodeChange} from "@xyflow/react";

interface GraphState {
    nodes: BaseNode[];
    edges: BaseEdge[];

    // node actions
    addNode: (node: BaseNode) => void;
    updateNode: (id: string, updater: (node: BaseNode) => void) => void;
    removeNode: (id: string) => void;
    setNodes: (nodes: BaseNode[]) => void;

    // edge actions
    addEdge: (edge: BaseEdge) => void;
    removeEdge: (id: string) => void;
    setEdges: (edges: BaseEdge[]) => void;

    onNodesChange: (changes: NodeChange<BaseNode>[]) => void;
    onEdgesChange: (changes: EdgeChange<BaseEdge>[]) => void;

    // graph
    clear: () => void;
}

const controller = new CoreController();

export const useGraphStore = create<GraphState>((set) => ({
    nodes: controller.Nodes,
    edges: controller.Edges,

    // ---------------- NODES ----------------
    addNode: (node) => {
        controller.addNode(node);

        set({
            nodes: [...controller.Nodes],
            edges: [...controller.Edges],
        });
    },

    removeNode: (id) => {
        controller.removeNode(id);

        set({
            nodes: [...controller.Nodes],
            edges: [...controller.Edges],
        });
    },

    updateNode: (id, updater) =>
        set((state) => {
            const nodes = state.nodes.map((node) => {
                if (node.id !== id) return node;

                const cloned = Object.assign(
                    Object.create(Object.getPrototypeOf(node)),
                    node
                );

                updater(cloned);

                return cloned;
            });

            return { nodes };
        }),


    setNodes: (nodes) => {
        controller.Nodes = nodes;

        set({
            nodes: [...controller.Nodes],
        });
    },

    // ---------------- EDGES ----------------
    addEdge: (edge) => {
        controller.addEdge(edge);

        set({
            nodes: [...controller.Nodes],
            edges: [...controller.Edges],
        });
    },

    removeEdge: (id) => {
        controller.removeEdge(id);

        set({
            nodes: [...controller.Nodes],
            edges: [...controller.Edges],
        });
    },

    setEdges: (edges) => {
        controller.Edges = edges;

        set({
            edges: [...controller.Edges],
        });
    },

    // ---------------- CHANGES ----------------
    onNodesChange: (changes) => {
        controller.applyNodeChanges(changes);

        set({
            nodes: [...controller.Nodes],
        });
    },

    onEdgesChange: (changes) => {
        controller.applyEdgeChanges(changes);

        set({
            edges: [...controller.Edges],
        });
    },

    // ---------------- GRAPH ----------------
    clear: () => {
        controller.clear();

        set({
            nodes: [...controller.Nodes],
            edges: [...controller.Edges],
        });
    }
}));
