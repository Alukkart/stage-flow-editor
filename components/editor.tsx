'use client';

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    Panel, DefaultEdgeOptions, FitViewOptions, Edge, Connection,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEditor } from './editor-selectors';
import { NodesCatalog } from "@/components/nodes-catalog";
import React, { useCallback, useEffect, useMemo } from "react";
import { BaseNode } from "@/core/nodes/baseNode";
import {edgeTypes, nodeTypes} from "@/core/nodes/nodeTypes";
import {EdgeLineStyle, EdgeStyleKind, useGraphStore} from "@/store/graph-store";
import {deserializeGraph, GRAPH_STORAGE_KEY, SerializedGraph, serializeGraph} from "@/lib/graph-storage";

const fitViewOptions: FitViewOptions = {padding: 0.2};
const defaultEdgeOptions: DefaultEdgeOptions = {animated: true, deletable: true,};

const toDashArray = (style: EdgeLineStyle) => {
    if (style === "dashed") return "5,5";
    if (style === "dotted") return "2,2";
    return undefined;
};

const resolveEdgeStyleKind = (edge: Edge, sourceTypeById: Map<string, string>): EdgeStyleKind => {
    if (edge.type === "orderEdge") {
        return "flow";
    }

    const sourceType = sourceTypeById.get(edge.source);
    if (sourceType === "inputsNode") {
        return "input";
    }

    if (typeof edge.label === "string" && edge.label.startsWith("inputs.")) {
        return "input";
    }

    return "data";
};

const getMiniMapNodeColor = (node: BaseNode) => {
    switch (node.type) {
        case "stageNode":
            return "#3b82f6"; // all server stage nodes
        case "inputsNode":
            return "#d97706";
        case "parallelNode":
            return "#8b5cf6";
        case "conditionNode":
            return "#eab308";
        case "terminalNode":
            return "#10b981";
        default:
            return "#64748b";
    }
};

const getMiniMapStrokeColor = (node: BaseNode) => {
    switch (node.type) {
        case "stageNode":
            return "#93c5fd";
        case "inputsNode":
            return "#fcd34d";
        case "parallelNode":
            return "#c4b5fd";
        case "conditionNode":
            return "#fde047";
        case "terminalNode":
            return "#6ee7b7";
        default:
            return "#cbd5e1";
    }
};

export function Editor() {
    const {
        nodes,
        edges,

        removeNode,
        removeEdge,

        onNodesChange,
        onEdgesChange,

        onConnect,
    } = useEditor();
    const edgeStyleSettings = useGraphStore((state) => state.edgeStyleSettings);
    const setGraph = useGraphStore((state) => state.setGraph);
    const undo = useGraphStore((state) => state.undo);
    const redo = useGraphStore((state) => state.redo);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = window.localStorage.getItem(GRAPH_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as SerializedGraph;
                const {
                    nodes: restoredNodes,
                    edges: restoredEdges,
                    edgeStyleSettings: restoredEdgeStyleSettings,
                } = deserializeGraph(parsed);
                setGraph(restoredNodes, restoredEdges, restoredEdgeStyleSettings, false);
            } catch (error) {
                console.error("Failed to restore graph from localStorage", error);
            }
        }

        let saveTimer: ReturnType<typeof setTimeout> | null = null;
        const unsubscribe = useGraphStore.subscribe((state) => {
            if (saveTimer) {
                clearTimeout(saveTimer);
            }

            saveTimer = setTimeout(() => {
                const payload = serializeGraph(state.nodes, state.edges, state.edgeStyleSettings);
                window.localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(payload));
            }, 250);
        });

        return () => {
            if (saveTimer) {
                clearTimeout(saveTimer);
            }
            unsubscribe();
        };
    }, [setGraph]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const isMeta = event.ctrlKey || event.metaKey;
            if (!isMeta || event.altKey) return;

            const key = event.key.toLowerCase();
            if (key === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    redo();
                    return;
                }
                undo();
                return;
            }

            if (key === "y") {
                event.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    const handleConnect = useCallback((connection: Connection) => {
        onConnect(connection);
    }, [onConnect]);

    const handleNodesRemove = useCallback((nodes: BaseNode[]) => {
        nodes.forEach((node: BaseNode) => {
            removeNode(node.id)
        })
    }, [removeNode]);

    const handleEdgesRemove = useCallback((edgesToDelete: Edge[]) => {
        edgesToDelete.forEach(edge => {
            removeEdge(edge.id)
        })
    }, [removeEdge])

    const handleEdgeRemove = useCallback((_event: React.MouseEvent, edge: Edge) => {
        removeEdge(edge.id)
    }, [removeEdge])

    const renderedEdges = useMemo(() => {
        const sourceTypeById = new Map(nodes.map((node) => [node.id, node.type]));

        return edges.map((edge) => {
            const styleKind = resolveEdgeStyleKind(edge, sourceTypeById);
            const config = edgeStyleSettings[styleKind];

            return {
                ...edge,
                hidden: !config.visible,
                style: {
                    ...edge.style,
                    stroke: config.color,
                    strokeWidth: config.width,
                    strokeDasharray: toDashArray(config.style),
                },
            };
        });
    }, [edges, nodes, edgeStyleSettings]);

    return (
        <div className="h-screen w-screen">
            <ReactFlowProvider>
                <ReactFlow
                    colorMode='dark'
                    nodes={nodes}
                    edges={renderedEdges}
                    minZoom={0.02}
                    maxZoom={2}
                    onlyRenderVisibleElements

                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}

                    onNodesDelete={handleNodesRemove}

                    onEdgeDoubleClick={handleEdgeRemove}
                    onEdgesDelete={handleEdgesRemove}

                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}

                    fitView
                    fitViewOptions={fitViewOptions}
                    defaultEdgeOptions={defaultEdgeOptions}
                    proOptions={{hideAttribution: true}}
                >
                    <Background />
                    <MiniMap
                        zoomable
                        pannable
                        nodeColor={(node) => getMiniMapNodeColor(node as BaseNode)}
                        nodeStrokeColor={(node) => getMiniMapStrokeColor(node as BaseNode)}
                        nodeBorderRadius={4}
                        bgColor="var(--card)"
                        maskColor="rgba(0, 0, 0, 0.35)"
                        style={{
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                        }}
                    />
                    <Controls />

                    <Panel position='top-left'>
                        <NodesCatalog/>
                    </Panel>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
