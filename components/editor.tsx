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
import React, { useCallback, useEffect } from "react";
import { BaseNode } from "@/core/nodes/baseNode";
import {edgeTypes, nodeTypes} from "@/core/nodes/nodeTypes";
import {useGraphStore} from "@/store/graph-store";
import {deserializeGraph, GRAPH_STORAGE_KEY, SerializedGraph, serializeGraph} from "@/lib/graph-storage";

const fitViewOptions: FitViewOptions = {padding: 0.2};
const defaultEdgeOptions: DefaultEdgeOptions = {animated: true, deletable: true,};

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

    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = window.localStorage.getItem(GRAPH_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as SerializedGraph;
                const {nodes: restoredNodes, edges: restoredEdges} = deserializeGraph(parsed);
                useGraphStore.getState().setNodes(restoredNodes);
                useGraphStore.getState().setEdges(restoredEdges);
            } catch (error) {
                console.error("Failed to restore graph from localStorage", error);
            }
        }

        const unsubscribe = useGraphStore.subscribe((state) => {
            const payload = serializeGraph(state.nodes, state.edges);
            window.localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(payload));
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleConnect = useCallback((connection: Connection) => {
        onConnect(connection);
    }, [onConnect]);

    const handleNodesRemove = useCallback((nodes: BaseNode[]) => {
        nodes.map((node: BaseNode) => {
            removeNode(node.id)
        })
    }, [removeNode]);

    const handleEdgesRemove = useCallback((edgesToDelete: Edge[]) => {
        edgesToDelete.map(edge => {
            removeEdge(edge.id)
        })
    }, [removeEdge])

    const handleEdgeRemove = useCallback((_event: React.MouseEvent, edge: Edge) => {
        removeEdge(edge.id)
    }, [removeEdge])

    console.log('Nodes:', nodes);
    console.log('Edges:', edges);

    return (
        <div className="h-screen w-screen">
            <ReactFlowProvider>
                <ReactFlow
                    colorMode='dark'
                    nodes={nodes}
                    edges={edges}

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
                    <MiniMap zoomable pannable />
                    <Controls />

                    <Panel position='top-left'>
                        <NodesCatalog/>
                    </Panel>
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
