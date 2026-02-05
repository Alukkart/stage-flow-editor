'use client'

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Handle, NodeProps, Position} from '@xyflow/react';
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useEditor} from "@/components/editor-selectors";
import {ParallelNode, ParallelNodeProps} from "@/core/nodes/parallelNode";
import {InputsNode} from "@/core/nodes/inputsNode";

export function ParallelNodeComp({id, data}: NodeProps<ParallelNodeProps>) {
    const {updateNode, getNode} = useEditor();

    const node = getNode(id) as InputsNode | undefined;
    if (!node) return null;

    const handleAddChildren = () => {
        const newChildren = data.childrenNodesIds ? [...data.childrenNodesIds, `art${data.childrenNodesIds.length + 1}`] : ['art1'];

        updateNode(id, (node) => {
            return ParallelNode.setData(node, { ...data, childrenNodesIds: newChildren  });
        });
    }

    const handleRemoveInput = (variable: string) => {
        if (data.childrenNodesIds && data.childrenNodesIds.length === 0) return;

        const newChildren = data.childrenNodesIds ? data.childrenNodesIds.filter((v) => v !== variable) : []

        updateNode(id, (node) => {
            return ParallelNode.setData(node, { ...data, childrenNodesIds: newChildren  });
        });
    }

    const handleChildrenChange = (index: number, value: string) => {
        const newChildren = data.childrenNodesIds ? [...data.childrenNodesIds] : [];
        newChildren[index] = value;

        updateNode(id, (node) => {
            return ParallelNode.setData(node, { ...data, childrenNodesIds: newChildren  });
        });
    }

    const handlePolicyChange = (value: "all" | "any") => {
        updateNode(id, (node) => {
            return ParallelNode.setData(node, { ...data, policy: value  });
        });
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
                            data?.childrenNodesIds?.map((artifact: string, index) => (
                                <div className='flex justify-center gap-3' key={index}>
                                    <Input value={artifact} onChange={(e) => {
                                        handleChildrenChange(index, e.target.value)
                                    }}/>

                                    <Button size='icon' onClick={() => handleRemoveInput(artifact)}>
                                        <X/>
                                    </Button>
                                </div>
                            ))
                        }

                        {
                            node.handles.map((handle) => (
                                handle.kind == 'data' && <Handle
                                    key={handle.id}
                                    id={handle.id}
                                    type={handle.type}
                                    position={handle.position}
                                    style={{
                                        width: handle.width,
                                        height: handle.height,
                                        left: handle.x - 5,
                                        top: handle.y + 5
                                    }}
                                />
                            ))
                        }
                    </div>

                    <Button className='mx-6' onClick={handleAddChildren}>
                        Add child
                    </Button>

                </CardContent>

                {
                    node.handles.map((handle) => (
                        handle.kind == 'order' && <Handle
                            key={handle.id}
                            id={handle.id}
                            type={handle.type}
                            position={handle.position}
                            style={{
                                width: handle.width,
                                height: handle.height,
                                left: handle.x + 5,
                                top: handle.position == Position.Bottom ? handle.y - 5 : handle.y + 5
                            }}
                        />
                    ))
                }

            </Card>
        </NodeContextMenu>

    );
}