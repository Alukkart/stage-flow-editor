'use client'

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {useEditor} from "@/components/editor-selectors";
import {Handle, NodeProps, Position} from '@xyflow/react';
import {InputsNodeProps} from "@/core/nodes/inputNode";

export function InputsNodeComp({id, data}: NodeProps<InputsNodeProps>) {
    const {updateNode} = useEditor();

    const handleAddInput = () => {
        const newVars = data.variables ? [...data.variables, `var${data.variables.length + 1}`] : ['var1'];

        updateNode(id, (data) => ({ ...data, vars: newVars }));
    }

    const handleRemoveInput = (variable: string) => {
        if (data.variables && data.variables.length === 0) return;

        const newVars = data.variables ? data.variables.filter((v) => v !== variable): []

        updateNode(id, (data) => ({ ...data, vars: newVars }));
    }

    const handleInputChange = (index: number, value: string) => {
        const newVars = data.variables ? [...data.variables] : [];
        newVars[index] = value;

        updateNode(id, (data) => ({ ...data, vars: newVars }));
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
                                    key={`out-var-${index}`}
                                    id={`out-var-${index}`}
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
                    id="inputs-node-handle-bottom"
                    type="target"
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