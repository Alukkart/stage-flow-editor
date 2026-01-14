'use client';

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    Panel, DefaultEdgeOptions, FitViewOptions, Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEditorSelector } from './editor-selectors';
import {nodeTypes} from "@/core/nodes/node.types";
import {NodesCatalog} from "@/components/nodes-catalog";
import {useCallback} from "react";

const fitViewOptions: FitViewOptions = { padding: 0.2, };
const defaultEdgeOptions: DefaultEdgeOptions = { animated: true, deletable: true, };

export function Editor() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        deleteEdge
    } = useEditorSelector();

    const handleEdgesRemove = useCallback((edgesToDelete: Edge[]) => {
        edgesToDelete.map(edge => {
            deleteEdge(edge.id)
        })
    }, [deleteEdge])

    const handleEdgeRemove = useCallback((_event: React.MouseEvent, edge: Edge) => {
        deleteEdge(edge.id)
    }, [deleteEdge])

    return (
        <div className="h-screen w-screen">
            <ReactFlow
                colorMode='dark'
                nodes={nodes}
                edges={edges}
                onEdgeDoubleClick={handleEdgeRemove}
                onEdgesDelete={handleEdgesRemove}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
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
