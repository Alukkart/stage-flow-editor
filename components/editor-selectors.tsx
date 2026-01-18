import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from "@/store/graph-store";

export const useEditor = () =>
    useGraphStore(
        useShallow(state => ({
            nodes: state.nodes,
            edges: state.edges,

            addNode: state.addNode,
            updateNode: state.updateNode,
            removeNode: state.removeNode,
            setNodes: state.setNodes,

            addEdge: state.addEdge,
            removeEdge: state.removeEdge,
            setEdges: state.setEdges,

            onNodesChange: state.onNodesChange,
            onEdgesChange: state.onEdgesChange,

            clear: state.clear,
        }))
    );
