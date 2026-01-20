'use client';

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    Panel, DefaultEdgeOptions, FitViewOptions, Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEditor } from './editor-selectors';
import { NodesCatalog } from "@/components/nodes-catalog";
import React, { useCallback } from "react";
import { BaseNode } from "@/core/nodes/baseNode";
import { nodeTypes} from "@/core/nodes/nodeTypes";

const fitViewOptions: FitViewOptions = {padding: 0.2};
const defaultEdgeOptions: DefaultEdgeOptions = {animated: true, deletable: true,};

export function Editor() {
    const {
        nodes,
        edges,

        removeNode,
        removeEdge,

        onNodesChange,
        onEdgesChange
    } = useEditor();

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
            <ReactFlow
                colorMode='dark'
                nodes={nodes}
                edges={edges}

                nodeTypes={nodeTypes}
                onNodesDelete={handleNodesRemove}

                onEdgeDoubleClick={handleEdgeRemove}
                onEdgesDelete={handleEdgesRemove}

                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                // onConnect={handleConnect}
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
        </div>
    );
}
