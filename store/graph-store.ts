import {create} from 'zustand';
import {BaseEdge} from "@/core/edges/baseEdge";
import {BaseNode} from "@/core/nodes/baseNode";
import {CoreController} from "@/core/coreController";
import {Connection, EdgeChange, NodeChange} from "@xyflow/react";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {StageNode} from "@/core/nodes/stageNode";
import {ConditionNode} from "@/core/nodes/conditionNode";
import {TerminalNode} from "@/core/nodes/terminalNode";
import {OrderEdge} from "@/core/edges/orderEdge";
import {DataEdge} from "@/core/edges/dataEdge";

export type EdgeStyleKind = "flow" | "data" | "input";
export type EdgeLineStyle = "solid" | "dashed" | "dotted";

export type EdgeStyleConfig = {
    visible: boolean;
    color: string;
    width: number;
    style: EdgeLineStyle;
};

export type EdgeStyleSettings = Record<EdgeStyleKind, EdgeStyleConfig>;

export const DEFAULT_EDGE_STYLE_SETTINGS: EdgeStyleSettings = {
    flow: {
        visible: true,
        color: "#94a3b8",
        width: 1.5,
        style: "dashed",
    },
    data: {
        visible: true,
        color: "#8b5cf6",
        width: 2.5,
        style: "solid",
    },
    input: {
        visible: true,
        color: "#d97706",
        width: 1.5,
        style: "dotted",
    },
};

type HistorySnapshot = {
    nodes: BaseNode[];
    edges: BaseEdge[];
    edgeStyleSettings: EdgeStyleSettings;
    signature: string;
};

const deepClone = <T,>(value: T): T => {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
};

const cloneEdgeStyleSettings = (settings: EdgeStyleSettings): EdgeStyleSettings => ({
    flow: {...settings.flow},
    data: {...settings.data},
    input: {...settings.input},
});

const cloneNode = (node: BaseNode): BaseNode => {
    if (node.type === "inputsNode") {
        return new InputsNode(node.id, {...node.position}, deepClone((node as InputsNode).data));
    }

    if (node.type === "parallelNode") {
        return new ParallelNode(node.id, {...node.position}, deepClone((node as ParallelNode).data));
    }

    if (node.type === "stageNode") {
        return new StageNode(node.id, {...node.position}, deepClone((node as StageNode).data));
    }

    if (node.type === "conditionNode") {
        return new ConditionNode(node.id, {...node.position}, deepClone((node as ConditionNode).data));
    }

    if (node.type === "terminalNode") {
        return new TerminalNode(node.id, {...node.position}, deepClone((node as TerminalNode).data));
    }

    return node;
};

const cloneEdge = (edge: BaseEdge): BaseEdge => {
    if (edge.type === "orderEdge") {
        const restored = new OrderEdge(
            edge.id,
            edge.source,
            edge.target,
            edge.sourceHandle ?? "",
            edge.targetHandle ?? "",
            deepClone(edge.data ?? {}),
        );
        restored.className = edge.className;
        restored.label = edge.label;
        restored.style = deepClone(edge.style ?? {});
        restored.animated = edge.animated;
        restored.markerEnd = edge.markerEnd;
        restored.hidden = edge.hidden;
        return restored;
    }

    const restored = new DataEdge(
        edge.id,
        edge.source,
        edge.target,
        edge.sourceHandle ?? "",
        edge.targetHandle ?? "",
        deepClone(edge.data ?? {}),
    );
    restored.className = edge.className;
    restored.label = edge.label;
    restored.style = deepClone(edge.style ?? {});
    restored.animated = edge.animated;
    restored.markerEnd = edge.markerEnd;
    restored.hidden = edge.hidden;
    return restored;
};

const buildSignature = (
    nodes: BaseNode[],
    edges: BaseEdge[],
    edgeStyleSettings: EdgeStyleSettings,
) => JSON.stringify({
    nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
    })),
    edges: edges.map((edge) => ({
        id: edge.id,
        type: edge.type,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        className: edge.className,
    })),
    edgeStyleSettings,
});

const shouldPersistNodeChanges = (changes: NodeChange<BaseNode>[]) => {
    if (changes.length === 0) return false;
    if (changes.some((change) => change.type !== "position")) return true;
    return changes.some((change) => {
        const withDragging = change as NodeChange<BaseNode> & {dragging?: boolean};
        return withDragging.dragging === false;
    });
};

interface GraphState {
    nodes: BaseNode[];
    edges: BaseEdge[];
    edgeStyleSettings: EdgeStyleSettings;
    canUndo: boolean;
    canRedo: boolean;

    onConnect: (connection: Connection) => void;
    // node actions
    getNode: (id: string) => BaseNode | undefined;
    addNode: (node: BaseNode) => void;
    updateNode: (id: string, updater: (node: BaseNode) => BaseNode) => void;
    removeNode: (id: string) => void;
    setNodes: (nodes: BaseNode[]) => void;
    setGraph: (
        nodes: BaseNode[],
        edges: BaseEdge[],
        edgeStyleSettings?: EdgeStyleSettings,
        trackHistory?: boolean,
    ) => void;

    // edge actions
    addEdge: (edge: BaseEdge) => void;
    removeEdge: (id: string) => void;
    setEdges: (edges: BaseEdge[]) => void;

    setEdgeStyleSettings: (settings: EdgeStyleSettings) => void;
    updateEdgeStyleSetting: (kind: EdgeStyleKind, patch: Partial<EdgeStyleConfig>) => void;

    onNodesChange: (changes: NodeChange<BaseNode>[]) => void;
    onEdgesChange: (changes: EdgeChange<BaseEdge>[]) => void;

    undo: () => void;
    redo: () => void;

    // graph
    clear: () => void;
}

const controller = new CoreController();

export const useGraphStore = create<GraphState>((set, get) => {
    const MAX_HISTORY_SIZE = 200;
    let history: HistorySnapshot[] = [];
    let historyIndex = -1;
    let isApplyingHistory = false;

    const syncHistoryFlags = () => {
        set({
            canUndo: historyIndex > 0,
            canRedo: historyIndex >= 0 && historyIndex < history.length - 1,
        });
    };

    const makeSnapshot = (
        nodes: BaseNode[],
        edges: BaseEdge[],
        edgeStyleSettings: EdgeStyleSettings,
    ): HistorySnapshot => {
        const clonedNodes = nodes.map((node) => cloneNode(node));
        const clonedEdges = edges.map((edge) => cloneEdge(edge));
        const clonedSettings = cloneEdgeStyleSettings(edgeStyleSettings);

        return {
            nodes: clonedNodes,
            edges: clonedEdges,
            edgeStyleSettings: clonedSettings,
            signature: buildSignature(clonedNodes, clonedEdges, clonedSettings),
        };
    };

    const pushHistory = () => {
        if (isApplyingHistory) return;

        const state = get();
        const nextSnapshot = makeSnapshot(state.nodes, state.edges, state.edgeStyleSettings);
        const currentSnapshot = history[historyIndex];

        if (currentSnapshot && currentSnapshot.signature === nextSnapshot.signature) {
            syncHistoryFlags();
            return;
        }

        history = history.slice(0, historyIndex + 1);
        history.push(nextSnapshot);

        if (history.length > MAX_HISTORY_SIZE) {
            history.shift();
        }

        historyIndex = history.length - 1;
        syncHistoryFlags();
    };

    const setHistoryBaseline = () => {
        const state = get();
        history = [makeSnapshot(state.nodes, state.edges, state.edgeStyleSettings)];
        historyIndex = 0;
        syncHistoryFlags();
    };

    const applySnapshot = (snapshot: HistorySnapshot) => {
        isApplyingHistory = true;
        controller.Nodes = snapshot.nodes.map((node) => cloneNode(node));
        controller.Edges = snapshot.edges.map((edge) => cloneEdge(edge));

        set({
            nodes: [...controller.Nodes],
            edges: [...controller.Edges],
            edgeStyleSettings: cloneEdgeStyleSettings(snapshot.edgeStyleSettings),
        });
        isApplyingHistory = false;
        syncHistoryFlags();
    };

    const initialState: GraphState = {
        nodes: controller.Nodes,
        edges: controller.Edges,
        edgeStyleSettings: cloneEdgeStyleSettings(DEFAULT_EDGE_STYLE_SETTINGS),
        canUndo: false,
        canRedo: false,

    // ---------------- NODES ----------------
        getNode: (id: string) => {
            return get().nodes.find(n => n.id === id);
        },

        addNode: (node) => {
            controller.addNode(node);

            set({
                nodes: [...controller.Nodes],
                edges: [...controller.Edges],
            });
            pushHistory();
        },

        removeNode: (id) => {
            controller.removeNode(id);

            set({
                nodes: [...controller.Nodes],
                edges: [...controller.Edges],
            });
            pushHistory();
        },

        updateNode: (id, updater) => {
            controller.updateNode(id, updater);

            set({
                nodes: [...controller.Nodes],
            });
            pushHistory();
        },

        setNodes: (nodes) => {
            controller.Nodes = nodes;

            set({
                nodes: [...controller.Nodes],
            });
            pushHistory();
        },

        setGraph: (nodes, edges, edgeStyleSettings, trackHistory = true) => {
            controller.Nodes = nodes;
            controller.Edges = edges;
            const nextSettings = edgeStyleSettings
                ? cloneEdgeStyleSettings(edgeStyleSettings)
                : cloneEdgeStyleSettings(get().edgeStyleSettings);

            set({
                nodes: [...controller.Nodes],
                edges: [...controller.Edges],
                edgeStyleSettings: nextSettings,
            });

            if (trackHistory) {
                pushHistory();
                return;
            }
            setHistoryBaseline();
        },

    // ---------------- EDGES ----------------
        addEdge: (edge) => {
            controller.addEdge(edge);

            set({
                nodes: [...controller.Nodes],
                edges: [...controller.Edges],
            });
            pushHistory();
        },

        removeEdge: (id) => {
            controller.removeEdge(id);

            set({
                nodes: [...controller.Nodes],
                edges: [...controller.Edges],
            });
            pushHistory();
        },

        setEdges: (edges) => {
            controller.Edges = edges;

            set({
                edges: [...controller.Edges],
            });
            pushHistory();
        },

        setEdgeStyleSettings: (settings) => {
            set({
                edgeStyleSettings: cloneEdgeStyleSettings(settings),
            });
            pushHistory();
        },

        updateEdgeStyleSetting: (kind, patch) => {
            set((state) => ({
                edgeStyleSettings: {
                    ...state.edgeStyleSettings,
                    [kind]: {
                        ...state.edgeStyleSettings[kind],
                        ...patch,
                    },
                },
            }));
            pushHistory();
        },

    // ---------------- CHANGES ----------------
        onNodesChange: (changes) => {
            controller.applyNodeChanges(changes);

            set({
                nodes: [...controller.Nodes],
            });
            if (shouldPersistNodeChanges(changes)) {
                pushHistory();
            }
        },

        onEdgesChange: (changes) => {
            controller.applyEdgeChanges(changes);

            set({
                edges: [...controller.Edges],
            });
            if (changes.length > 0) {
                pushHistory();
            }
        },

        onConnect: (conn: Connection) => {
            try {
                controller.connect(conn)
            } catch (error) {
                console.error("Failed to connect nodes", error);
                if (typeof window !== "undefined") {
                    alert(error instanceof Error ? error.message : "Connection error");
                }
            }

            set({
                edges: [...controller.Edges],
                nodes: [...controller.Nodes],
            });
            pushHistory();
        },

        undo: () => {
            if (historyIndex <= 0) return;
            historyIndex -= 1;
            const snapshot = history[historyIndex];
            if (!snapshot) return;
            applySnapshot(snapshot);
        },

        redo: () => {
            if (historyIndex >= history.length - 1) return;
            historyIndex += 1;
            const snapshot = history[historyIndex];
            if (!snapshot) return;
            applySnapshot(snapshot);
        },


    // ---------------- GRAPH ----------------
        clear: () => {
            controller.clear();

            set({
                nodes: [...controller.Nodes],
                edges: [...controller.Edges],
            });
            pushHistory();
        }
    };

    history = [makeSnapshot(initialState.nodes, initialState.edges, initialState.edgeStyleSettings)];
    historyIndex = 0;

    return initialState;
});
