'use client'

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Handle, Node, NodeProps, Position} from '@xyflow/react';
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useNodesStore} from "@/store/nodes-store";

type ParallelNode = Node<{
    policy: string;
    childrenNodes?: string[]
}, 'number'>;

export function ParallelNode({id, data}: NodeProps<ParallelNode>) {
    const {updateNodeData} = useNodesStore();

    const handleAddChildren = () => {
        const newChildren = data.childrenNodes ? [...data.childrenNodes, `art${data.childrenNodes.length + 1}`] : ['art1'];

        updateNodeData(id, (data) => ({...data, childrenNodes: newChildren}));
    }

    const handleRemoveInput = (variable: string) => {
        if (data.childrenNodes && data.childrenNodes.length === 0) return;

        const newChildren = data.childrenNodes ? data.childrenNodes.filter((v) => v !== variable) : []

        updateNodeData(id, (data) => ({...data, childrenNodes: newChildren}));
    }

    const handleChildrenChange = (index: number, value: string) => {
        const newChildren = data.childrenNodes ? [...data.childrenNodes] : [];
        newChildren[index] = value;

        updateNodeData(id, (data) => ({...data, childrenNodes: newChildren}));

    }

    const handlePolicyChange = (value: string) => {
        updateNodeData(id, (data) => ({...data, policy: value}));
    }

    return (
        <NodeContextMenu nodeId={id}>
            <Card className='w-sm'>
                <CardHeader>
                    <CardTitle>
                        Parallel Node
                    </CardTitle>
                    <CardDescription>
                        ctx_retriever
                    </CardDescription>
                </CardHeader>
                <CardContent className='px-0 flex flex-col gap-4 relative'>
                    <div className='px-6'>
                        <Label className='mb-2'>
                            Policy
                        </Label>
                        <Select defaultValue='all' onValueChange={handlePolicyChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="any">Any</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Label className='px-6'>
                        Children Nodes
                    </Label>

                    <div className='flex flex-col gap-4 relative px-6'>
                        {
                            data?.childrenNodes?.map((artifact: string, index) => (
                                <div className='flex justify-center gap-3' key={index}>
                                    <Input value={artifact} onChange={(e) => {
                                        handleChildrenChange(index, e.target.value)
                                    }}/>

                                    <Button size='icon' onClick={() => handleRemoveInput(artifact)}>
                                        <X/>
                                    </Button>

                                    <Handle
                                        key={`in-${artifact}`}
                                        id={`in-${artifact}`}
                                        type="target"
                                        position={Position.Right}
                                        style={{
                                            top: 36 / 2 + (index * 52),
                                            width: 10,
                                            height: 10,
                                        }}
                                    />
                                </div>
                            ))
                        }
                    </div>

                    <Button className='mx-6' onClick={handleAddChildren}>
                        Add child
                    </Button>

                </CardContent>

                <Handle
                    id="parallel-node-handle-top"
                    type="target"
                    position={Position.Top}
                    style={{
                        width: 10,
                        height: 10,
                    }}
                />

                <Handle
                    id="parallel-node-handle-botom"
                    type="source"
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