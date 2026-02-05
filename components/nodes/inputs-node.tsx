'use client'

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {useEditor} from "@/components/editor-selectors";
import {Handle, NodeProps} from '@xyflow/react';
import {InputsNode, InputsNodeProps} from "@/core/nodes/inputsNode";

export function InputsNodeComp({id, data}: NodeProps<InputsNodeProps>) {
    const {updateNode, getNode} = useEditor();

    const node = getNode(id) as InputsNode | undefined;
    if (!node) return null;


    const handleAddInput = () => {
        const newVars = data.variables ? [...data.variables, `var${data.variables.length + 1}`] : ['var1'];

        updateNode(id, (node) => {
            return InputsNode.setData(node, {variables: newVars});
        });
    }

    const handleRemoveInput = (variable: string) => {
        if (data.variables && data.variables.length === 0) return;

        const newVars = data.variables ? data.variables.filter((v) => v !== variable) : []

        updateNode(id, (node) => {
            return InputsNode.setData(node, {variables: newVars});
        });
    }

    const handleInputChange = (index: number, value: string) => {
        const newVars = data.variables ? [...data.variables] : [];
        newVars[index] = value;

        updateNode(id, (node) => {
            return InputsNode.setData(node, {variables: newVars});
        });
    }

    return (
        <NodeContextMenu nodeId={id}>
            <div className="relative">
                <Card className='w-sm'>
                    <CardHeader>
                        <CardTitle>
                            Input Node
                        </CardTitle>
                        <CardDescription>
                            Input variable for the pipeline
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-4'>
                        {
                            data?.variables?.map((variable: string, i) => (
                                <div className='flex justify-center gap-3' key={i}>
                                    <Input value={variable} onChange={(e) => {
                                        handleInputChange(i, e.target.value)
                                    }}/>

                                    <Button size='icon' onClick={() => handleRemoveInput(variable)}>
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

                        <Button onClick={handleAddInput}>
                            Add input
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
                                    top: handle.y - 5
                                }}
                            />
                        ))
                    }
                </Card>
            </div>
        </NodeContextMenu>

    );
}