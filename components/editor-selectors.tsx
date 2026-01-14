import { useShallow } from 'zustand/react/shallow';
import {useNodesStore} from "@/store/nodes-store";

export const useEditorSelector = () =>
    useNodesStore(
        useShallow(state => ({
            nodes: state.nodes,
            edges: state.edges,
            onNodesChange: state.onNodesChange,
            onEdgesChange: state.onEdgesChange,
            deleteNode: state.deleteNode,
            deleteEdge: state.deleteEdge,
            onConnect: state.onConnect,
            undo: state.undo,
            redo: state.redo,
            autoLayoutNodes: state.autoLayoutNodes,
        }))
    );
