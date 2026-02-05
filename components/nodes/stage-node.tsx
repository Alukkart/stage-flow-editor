'use client'

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {Handle, NodeProps, Position} from "@xyflow/react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {useEditor} from "@/components/editor-selectors";
import {StageNode, StageNodeProps} from "@/core/nodes/stageNode";

const renderParamMeta = (type: string, optional?: boolean) => {
    const optionalSuffix = optional ? "?" : "";
    return `${type}${optionalSuffix}`;
};

export function StageNodeComp({id, data}: NodeProps<StageNodeProps>) {
    const {getNode} = useEditor();
    const node = getNode(id) as StageNode | undefined;
    if (!node) return null;

    const stage = data.stage;
    const dataHandles = node.handles.filter((handle) => handle.kind === "data");
    const orderHandles = node.handles.filter((handle) => handle.kind === "order");

    return (
        <NodeContextMenu nodeId={id}>
            <Card className="w-sm relative">
                <CardHeader>
                    <CardTitle>{stage.stage_name}</CardTitle>
                    <CardDescription>{stage.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6 relative px-0">
                    <div className="flex flex-col gap-2">
                        <span className="px-6 text-sm font-semibold">Arguments</span>
                        {stage.arguments.length === 0 ? (
                            <span className="px-6 text-xs text-muted-foreground">No arguments</span>
                        ) : (
                            stage.arguments.map((arg) => (
                                <div key={arg.name} className="flex flex-col gap-1 px-6 py-1">
                                    <span className="text-sm">{arg.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {renderParamMeta(arg.type, arg.optional)}
                                    </span>
                                    {arg.description && (
                                        <span className="text-xs text-muted-foreground">{arg.description}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="px-6 text-sm font-semibold">Outputs</span>
                        {stage.outputs.length === 0 ? (
                            <span className="px-6 text-xs text-muted-foreground">No outputs</span>
                        ) : (
                            stage.outputs.map((output) => (
                                <div key={output.name} className="flex flex-col gap-1 px-6 py-1">
                                    <span className="text-sm">{output.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {renderParamMeta(output.type, output.optional)}
                                    </span>
                                    {output.description && (
                                        <span className="text-xs text-muted-foreground">{output.description}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="px-6 text-sm font-semibold">Config</span>
                        {stage.config.length === 0 ? (
                            <span className="px-6 text-xs text-muted-foreground">No config</span>
                        ) : (
                            stage.config.map((cfg) => (
                                <div key={cfg.name} className="flex flex-col gap-1 px-6 py-1">
                                    <span className="text-sm">{cfg.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {renderParamMeta(cfg.type, cfg.optional)}
                                    </span>
                                    {cfg.description && (
                                        <span className="text-xs text-muted-foreground">{cfg.description}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>

                {dataHandles.map((handle) => (
                    <Handle
                        key={handle.id}
                        id={handle.id}
                        type={handle.type}
                        position={handle.position}
                        style={{
                            width: handle.width,
                            height: handle.height,
                            left: handle.x - 5,
                            top: handle.y + 5,
                        }}
                    />
                ))}

                {orderHandles.map((handle) => (
                    <Handle
                        key={handle.id}
                        id={handle.id}
                        type={handle.type}
                        position={handle.position}
                        style={{
                            width: handle.width,
                            height: handle.height,
                            left: handle.x + 5,
                            top: handle.position === Position.Top ? handle.y + 5 : undefined,
                            bottom: handle.position === Position.Bottom ? -5 : undefined,
                        }}
                    />
                ))}
            </Card>
        </NodeContextMenu>
    );
}
