'use client'

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {useEditor} from "@/components/editor-selectors";
import {Handle, NodeProps, Position, useUpdateNodeInternals} from '@xyflow/react';
import {InputsNode, InputsNodeProps} from "@/core/nodes/inputsNode";

export function InputsNodeComp({id, data}: NodeProps<InputsNodeProps>) {
    const {updateNode} = useEditor();
    const updateNodeInternals = useUpdateNodeInternals();

    const handleAddInput = () => {
        const newVars = data.variables ? [...data.variables, `var${data.variables.length + 1}`] : ['var1'];

        updateNode(id, (node) => {
            return InputsNode.setData(node, {variables: newVars});
        });

        updateNodeInternals(id)
    }

    const handleRemoveInput = (variable: string) => {
        if (data.variables && data.variables.length === 0) return;

        const newVars = data.variables ? data.variables.filter((v) => v !== variable): []

        updateNode(id, (node) => {
            return InputsNode.setData(node, {variables: newVars});
        });

        updateNodeInternals(id)
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
            <Card className='w-sm'>
                <CardHeader>
                    <CardTitle>
                        Input Node
                    </CardTitle>
                    <CardDescription>
                        Input variable for the pipeline
                    </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-4 relative'>
                    {
                        data?.variables?.map((variable: string, index) => (
                            <div className='flex justify-center gap-3' key={index}>
                                <Input value={variable} onChange={(e) => {
                                    handleInputChange(index, e.target.value)
                                }}/>

                                <Button size='icon' onClick={() => handleRemoveInput(variable)}>
                                    <X/>
                                </Button>

                                <Handle
                                    type="source"
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

                    <Button onClick={handleAddInput}>
                        Add input
                    </Button>

                </CardContent>

                <Handle
                    id='1'
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