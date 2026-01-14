'use client'

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { NodeContextMenu } from "@/components/node-context-menu";
import {useNodesStore} from "@/store/nodes-store";

type StageNode = Node<{
    arguments?: string[];
    config?: string[];
    outputs?: string[];
}, 'stage-node'>;

export function StageNode({ id, data }: NodeProps<StageNode>) {
    const { updateNodeData } = useNodesStore();

    const updateList = (key: 'arguments' | 'config' | 'outputs', value: string[]) => {
        updateNodeData(id, (data) => ({ ...data, [key]: value }));
    };

    const addItem = (key: 'arguments' | 'config' | 'outputs', prefix: string) => {
        const list = data[key] ?? [];
        updateList(key, [...list, `${prefix}${list.length + 1}`]);
    };

    const removeItem = (key: 'arguments' | 'config' | 'outputs', name: string) => {
        updateList(
            key,
            (data[key] ?? []).filter(v => v !== name)
        );
    };

    const changeItem = (
        key: 'arguments' | 'config' | 'outputs',
        index: number,
        value: string
    ) => {
        const list = [...(data[key] ?? [])];
        list[index] = value;
        updateList(key, list);
    };

    const renderSection = (
        title: string,
        keyName: 'arguments' | 'config' | 'outputs',
        handleType: 'source' | 'target',
        handlePosition: Position,
        prefix: string
    ) => (
        <div className="flex flex-col gap-2 relative">
            <div className="flex items-center justify-between px-6">
                <span className="text-sm font-semibold">{title}</span>
                <Button size="icon" variant="ghost" onClick={() => addItem(keyName, prefix)}>
                    <Plus size={16} />
                </Button>
            </div>

            {data[keyName]?.map((item, index) => (
                <div key={item} className="relative flex items-center gap-2 px-6">
                    <Input
                        value={item}
                        onChange={(e) => changeItem(keyName, index, e.target.value)}
                    />

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(keyName, item)}
                    >
                        <X size={16} />
                    </Button>

                    <Handle
                        id={`${keyName}-${item}`}
                        type={handleType}
                        position={handlePosition}
                        style={{
                            top: 32 / 2 + index,
                            width: 10,
                            height: 10,
                        }}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <NodeContextMenu nodeId={id}>
            <Card className="w-sm">

                <Handle
                    id={`${id}-top-handle`}
                    type={"target"}
                    position={Position.Top}
                    style={{
                        width: 10,
                        height: 10,
                    }}
                />

                <CardHeader>
                    <CardTitle>Stage Node</CardTitle>
                    <CardDescription>Dynamic stage configuration</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6 relative px-0">
                    {renderSection('Arguments', 'arguments', 'target', Position.Left, 'arg')}
                    {renderSection('Outputs', 'outputs', 'source', Position.Right, 'out')}
                    {renderSection('Config', 'config', 'target', Position.Left, 'cfg')}
                </CardContent>

                <Handle
                    id={`${id}-bottom-handle`}
                    type={"source"}
                    position={Position.Bottom}
                    style={{
                        width: 10,
                        height: 10,
                    }}
                />

            </Card>
        </NodeContextMenu>
    );
}
