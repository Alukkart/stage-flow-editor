'use client'

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Handle, Node, NodeProps, Position} from '@xyflow/react';
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {Label} from "@/components/ui/label";
import {useEditor} from "@/components/editor-selectors";

type TerminalNode = Node<{
    result: string;
    artifacts?: string[]
}, 'number'>;

export function TerminalNode({id, data}: NodeProps<TerminalNode>) {
    const {updateNode} = useEditor();

    const handleAddArtifact = () => {
        const newArtifacts = data.artifacts ? [...data.artifacts, `art${data.artifacts.length + 1}`] : ['art1'];

        updateNode(id, (data) => ({ ...data, artifacts: newArtifacts }));
    }

    const handleRemoveInput = (variable: string) => {
        if (data.artifacts && data.artifacts.length === 0) return;

        const newArtifacts = data.artifacts ? data.artifacts.filter((v) => v !== variable) : []

        updateNode(id, (data) => ({ ...data, vars: {artifacts: newArtifacts} }));
    }

    const handleArtifactChange = (index: number, value: string) => {
        const newArtifacts = data.artifacts ? [...data.artifacts] : [];
        newArtifacts[index] = value;

        updateNode(id, (data) => ({ ...data, artifacts: newArtifacts }));
    }

    const handleResultChange = (value: string) => {
        updateNode(id, (data) => ({ ...data, result: value }));
    }

    return (
        <NodeContextMenu nodeId={id}>
            <Card className='w-sm'>
                <CardHeader>
                    <CardTitle>
                        Terminal Node
                    </CardTitle>
                    <CardDescription>
                        Terminal
                    </CardDescription>
                </CardHeader>
                <CardContent className='px-0 flex flex-col gap-4 relative'>
                    <div className='px-6'>
                        <Label className='mb-2'>
                            Result
                        </Label>
                        <Input
                            defaultValue='success'
                            onChange={(e) => {
                                handleResultChange(e.target.value)
                            }}
                        />
                    </div>

                    <Label className='px-6'>
                        Artifacts
                    </Label>

                    <div className='flex flex-col gap-4 relative px-6'>
                        {
                            data?.artifacts?.map((artifact: string, index) => (
                                <div className='flex justify-center gap-3' key={index}>
                                    <Input value={artifact} onChange={(e) => {
                                        handleArtifactChange(index, e.target.value)
                                    }}/>

                                    <Button size='icon' onClick={() => handleRemoveInput(artifact)}>
                                        <X/>
                                    </Button>

                                    <Handle
                                        key={`in-${artifact}`}
                                        id={`in-${artifact}`}
                                        type="target"
                                        position={Position.Left}
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

                    <Button className='mx-6' onClick={handleAddArtifact}>
                        Add artifact
                    </Button>

                </CardContent>

                <Handle
                    id="terminal-node-handle-top"
                    type="target"
                    position={Position.Top}
                    style={{
                        width: 10,
                        height: 10,
                    }}
                />

            </Card>
        </NodeContextMenu>

    );
}