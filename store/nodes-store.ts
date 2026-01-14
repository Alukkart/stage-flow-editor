import {create} from 'zustand';
import {applyNodeChanges, applyEdgeChanges} from '@xyflow/react';
import {FlowNode, FlowNodeData, NodesState} from "@/core/nodes/node.types";
import {applyConnection} from "@/core/edges/connect";
import {FlowSnapshot} from "@/core/nodes/history.types";
import {autoLayout} from "@/core/layout/auto-layout";
import { type Node } from '@xyflow/react';
const snapshot = (state: NodesState): FlowSnapshot => ({
    nodes: state.nodes,
    edges: state.edges,
});

export const useNodesStore = create<NodesState>((set, get) => ({
    nodes: [],
    edges: [],
    history: {
        past: [],
        future: [],
    },

    pushHistory() {
        const {history, ...state} = get();
        set({
            history: {
                past: [...history.past, snapshot(state as NodesState)],
                future: [],
            },
        });
    },

    undo() {
        const {history} = get();
        if (!history.past.length) return;

        const previous = history.past.at(-1)!;
        const newPast = history.past.slice(0, -1);

        set({
            nodes: previous.nodes,
            edges: previous.edges,
            history: {
                past: newPast,
                future: [snapshot(get()), ...history.future],
            },
        });
    },

    redo() {
        const {history} = get();
        if (!history.future.length) return;

        const next = history.future[0];

        set({
            nodes: next.nodes,
            edges: next.edges,
            history: {
                past: [...history.past, snapshot(get())],
                future: history.future.slice(1),
            },
        });
    },

    addNode: (node: Partial<FlowNode> & { type: string }) => {
        const id = crypto.randomUUID();
        const newNode: FlowNode = {
            id,
            type: node.type,
            position: node.position ?? { x: 0, y: 0 },
            data: (node.data ?? {}) as FlowNodeData,
        };
        set((state: NodesState) => ({
            nodes: [...state.nodes, newNode],
        }));
    },

    onNodesChange: changes => {
        set({nodes: applyNodeChanges(changes, get().nodes) as Node<FlowNodeData>[]});
    },

    onEdgesChange: changes => {
        set({edges: applyEdgeChanges(changes, get().edges)});
    },

    onConnect: connection => {
        const result = applyConnection(
            get().nodes,
            get().edges,
            connection
        );

        if (result) {
            console.log(result);
            set(result);
        }
    },

    setNodes: nodes => set({nodes}),
    setEdges: edges => set({edges}),

    updateNodeData: (id: string, updater: (data: FlowNodeData) => FlowNodeData) => {
        set((state: NodesState) => ({
            nodes: state.nodes.map(n =>
                n.id === id ? { ...n, data: updater(n.data) } : n
            ),
        }));
    },

    deleteNode: id => {
        set(state => ({
            nodes: state.nodes.filter(n => n.id !== id),
            edges: state.edges.filter(
                e => e.source !== id && e.target !== id
            ),
        }));
    },

    deleteEdge: id => {
        set(state => ({
            edges: state.edges.filter(e => e.id !== id),
        }));
    },

    autoLayoutNodes() {
        get().pushHistory();
        set({
            nodes: autoLayout(get().nodes, get().edges),
        });
    }
}));
